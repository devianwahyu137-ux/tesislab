"use client";

import { useEffect, useRef, useState } from "react";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { AgentRole, AuditPhase } from "@/context/AuditUIContext";
import type { Theme } from "@/context/ThemeContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { VerdictStatus } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

export type StationId = "hermes" | AgentRole;

export type OfficeInteractionId =
  | "whiteboard"
  | "wall_screen"
  | "meeting_table"
  | "coffee_bar"
  | "hermes_rack"
  | "quant_desk"
  | "risk_desk"
  | "bookshelf"
  | "agent_wave";

export type CameraPresetId =
  | "panorama"
  | "meeting"
  | "desks"
  | "top"
  | "follow";

export interface OfficeCommandEvent {
  interaction: OfficeInteractionId;
  nonce: number;
}

export interface WarRoom3DCanvasProps {
  theme: Theme;
  auditPhase: AuditPhase;
  activeAgent: AgentRole | null;
  verdictStatus?: VerdictStatus;
  liveRiskScore?: number | null;
  macroOrigin: MacroFeedOrigin;
  selectedStation: StationId;
  onSelectStation: (station: StationId) => void;
  onOfficeInteract?: (interaction: OfficeInteractionId, actor: StationId) => void;
  externalCommand?: OfficeCommandEvent | null;
  simSpeed?: 0 | 1 | 2;
  stationLabels: Record<StationId, string>;
  fallbackText: string;
}

interface DynamicStateRef {
  theme: Theme;
  auditPhase: AuditPhase;
  activeAgent: AgentRole | null;
  verdictStatus?: VerdictStatus;
  liveRiskScore?: number | null;
  macroOrigin: MacroFeedOrigin;
  selectedStation: StationId;
  simSpeed: 0 | 1 | 2;
  cameraPreset: CameraPresetId;
}

const STATION_IDS: readonly StationId[] = [
  "hermes",
  "data_analyst",
  "risk_manager",
  "committee_chair",
];

const OFFICE_PALETTES = {
  dark: {
    canvasBg: 0x090d16,
    floor: 0x1e2736,
    wall: 0x151d2b,
    wallTrim: 0x334155,
    wood: 0xc88a52,
    woodDark: 0x7c4f28,
    chairMat: 0x293548,
    shelfMat: 0xcbd5e1,
    rugRound: 0x283548,
    hemiSky: 0xf8fafc,
    hemiGround: 0x334155,
    hemiIntensity: 1.45,
    sunIntensity: 1.65,
    fillIntensity: 0.72,
    bloomIntensity: 0.18,
  },
  light: {
    canvasBg: 0xe8eef5,
    floor: 0xdfe5ee,
    wall: 0xf4f6fa,
    wallTrim: 0xcbd5e1,
    wood: 0xc98d55,
    woodDark: 0x8f5b30,
    chairMat: 0x475569,
    shelfMat: 0xffffff,
    rugRound: 0xcbd5e1,
    hemiSky: 0xffffff,
    hemiGround: 0xcbd5e1,
    hemiIntensity: 1.6,
    sunIntensity: 1.5,
    fillIntensity: 0.6,
    bloomIntensity: 0.08,
  },
} as const;

const AGENT_COLORS: Record<StationId, number> = {
  hermes: 0x38bdf8, // Sky Blue
  data_analyst: 0x10b981, // Vivid Emerald
  risk_manager: 0xef4444, // Vivid Coral Red
  committee_chair: 0xf59e0b, // Executive Gold
};

const IDLE_MICRO_TASKS: Record<StationId, string> = {
  hermes: "Pantau IHSG & Kurs",
  data_analyst: "Hitung R:R & Lot BEI",
  risk_manager: "Simulasi 1.000 MC",
  committee_chair: "Tinjau Berkas Veto",
};

const ACTION_MICRO_LABELS: Record<
  "idle" | "present" | "meeting" | "coffee" | "wave" | "type" | "read" | "sit_desk",
  string
> = {
  idle: "",
  present: "Bedah Papan Risiko",
  meeting: "Sidang Meja Bundar",
  coffee: "Isi Kopi Espresso ☕",
  wave: "Siap Melapor!",
  type: "Pantau Layar & Kalibrasi",
  read: "Baca Laporan & Arsip",
  sit_desk: "Duduk · Pantau PC",
};

interface FurnitureObstacle {
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  isCircle?: boolean;
  r?: number;
}

const STUDIO_OBSTACLES: readonly FurnitureObstacle[] = [
  // Round conference table top (chairs sit at radius ~1.22 around it)
  { cx: 1.55, cz: 1.55, hx: 0.92, hz: 0.92, isCircle: true, r: 0.92 },
  // Quant desk surface only (chair is behind at -1.85, 1.76)
  { cx: -1.95, cz: 1.05, hx: 0.92, hz: 0.46 },
  // Risk desk surface only (chair is behind at 2.11, -0.74)
  { cx: 2.25, cz: -1.45, hx: 0.92, hz: 0.46 },
  // Hermes server rack
  { cx: -3.25, cz: -2.75, hx: 0.62, hz: 0.48 },
  // Bookshelf
  { cx: -1.95, cz: -3.35, hx: 0.6, hz: 0.32 },
  // Coffee bar
  { cx: -3.85, cz: 2.75, hx: 0.58, hz: 0.76 },
];

function isPointBlocked(x: number, z: number, pad = 0.24): boolean {
  if (x < -4.25 || x > 4.35 || z < -3.35 || z > 3.65) return true;
  for (const obs of STUDIO_OBSTACLES) {
    if (obs.isCircle && obs.r) {
      if (Math.hypot(x - obs.cx, z - obs.cz) < obs.r + pad) return true;
    } else {
      if (
        x > obs.cx - (obs.hx + pad) &&
        x < obs.cx + (obs.hx + pad) &&
        z > obs.cz - (obs.hz + pad) &&
        z < obs.cz + (obs.hz + pad)
      ) {
        return true;
      }
    }
  }
  return false;
}

// Fast 2D Grid BFS Pathfinder (0.4m resolution across 9.8m x 8.2m studio)
const NAV_CELL = 0.4;
const NAV_MIN_X = -4.2;
const NAV_MIN_Z = -3.3;
const NAV_COLS = 22; // -4.2 .. +4.2
const NAV_ROWS = 18; // -3.3 .. +3.5

function computeStudioPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const toCol = (x: number) =>
    Math.max(0, Math.min(NAV_COLS - 1, Math.round((x - NAV_MIN_X) / NAV_CELL)));
  const toRow = (z: number) =>
    Math.max(0, Math.min(NAV_ROWS - 1, Math.round((z - NAV_MIN_Z) / NAV_CELL)));
  const cellWorld = (c: number, r: number) =>
    new THREE.Vector3(NAV_MIN_X + c * NAV_CELL, 0, NAV_MIN_Z + r * NAV_CELL);

  const sc = toCol(from.x);
  const sr = toRow(from.z);
  const gc = toCol(to.x);
  const gr = toRow(to.z);

  if (sc === gc && sr === gr) return [to.clone()];

  const total = NAV_COLS * NAV_ROWS;
  const visited = new Uint8Array(total);
  const parent = new Int16Array(total).fill(-1);
  const queue: number[] = [];

  const startIdx = sr * NAV_COLS + sc;
  const goalIdx = gr * NAV_COLS + gc;
  visited[startIdx] = 1;
  queue.push(startIdx);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const;

  let found = false;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    if (cur === goalIdx) {
      found = true;
      break;
    }
    const cc = cur % NAV_COLS;
    const cr = Math.floor(cur / NAV_COLS);
    for (const [dc, dr] of dirs) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= NAV_COLS || nr < 0 || nr >= NAV_ROWS) continue;
      const nIdx = nr * NAV_COLS + nc;
      if (visited[nIdx]) continue;
      const wp = cellWorld(nc, nr);
      // Always allow start/goal cells so agents can reach chairs/stations
      if (nIdx !== goalIdx && isPointBlocked(wp.x, wp.z, 0.22)) continue;
      // Prevent diagonal corner-cutting through obstacles
      if (dc !== 0 && dr !== 0) {
        const w1 = cellWorld(cc + dc, cr);
        const w2 = cellWorld(cc, cr + dr);
        if (isPointBlocked(w1.x, w1.z, 0.2) || isPointBlocked(w2.x, w2.z, 0.2)) {
          continue;
        }
      }
      visited[nIdx] = 1;
      parent[nIdx] = cur;
      queue.push(nIdx);
    }
  }

  if (!found) return [to.clone()];

  const rawWaypoints: THREE.Vector3[] = [];
  let trace = goalIdx;
  while (trace !== -1 && trace !== startIdx) {
    const tc = trace % NAV_COLS;
    const tr = Math.floor(trace / NAV_COLS);
    rawWaypoints.push(cellWorld(tc, tr));
    trace = parent[trace]!;
  }
  rawWaypoints.reverse();
  if (rawWaypoints.length > 0) {
    rawWaypoints[rawWaypoints.length - 1] = to.clone();
  } else {
    rawWaypoints.push(to.clone());
  }
  return rawWaypoints;
}

function resolveObstacleCollision(pos: THREE.Vector3, agentRadius = 0.22): void {
  pos.x = Math.max(-4.25, Math.min(4.35, pos.x));
  pos.z = Math.max(-3.35, Math.min(3.65, pos.z));

  for (const obs of STUDIO_OBSTACLES) {
    if (obs.isCircle && obs.r) {
      const dx = pos.x - obs.cx;
      const dz = pos.z - obs.cz;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.r + agentRadius;
      if (dist < minDist) {
        if (dist > 0.0001) {
          pos.x = obs.cx + (dx / dist) * minDist;
          pos.z = obs.cz + (dz / dist) * minDist;
        } else {
          pos.x = obs.cx + minDist;
        }
      }
    } else {
      const minX = obs.cx - (obs.hx + agentRadius);
      const maxX = obs.cx + (obs.hx + agentRadius);
      const minZ = obs.cz - (obs.hz + agentRadius);
      const maxZ = obs.cz + (obs.hz + agentRadius);
      if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
        const penLeft = pos.x - minX;
        const penRight = maxX - pos.x;
        const penTop = pos.z - minZ;
        const penBot = maxZ - pos.z;
        const minPen = Math.min(penLeft, penRight, penTop, penBot);
        if (minPen === penLeft) pos.x = minX;
        else if (minPen === penRight) pos.x = maxX;
        else if (minPen === penTop) pos.z = minZ;
        else pos.z = maxZ;
      }
    }
  }
}

interface AutonomousStop {
  pos: THREE.Vector3;
  lookAt: THREE.Vector3;
  action: "sit_desk" | "type" | "present" | "read" | "coffee" | "meeting";
  dwell: number;
}

// Calibrated zero-clipping camera presets (positions + exact lookAt targets)
const CAMERA_PRESETS: Record<
  Exclude<CameraPresetId, "follow">,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  panorama: {
    pos: [7.8, 6.75, 8.75],
    target: [0.05, 0.68, 0.05],
  },
  meeting: {
    pos: [5.1, 3.85, 5.75],
    target: [1.55, 0.72, 1.55],
  },
  desks: {
    pos: [-0.25, 3.55, 6.45],
    target: [0.1, 1.05, -1.65],
  },
  top: {
    pos: [0.05, 12.6, 1.35],
    target: [0.0, 0.35, 0.15],
  },
};

function tagStation(
  group: THREE.Object3D,
  stationId: StationId,
  propId?: OfficeInteractionId
) {
  group.userData.stationId = stationId;
  if (propId) group.userData.propId = propId;
  group.traverse((child) => {
    child.userData.stationId = stationId;
    if (propId) child.userData.propId = propId;
  });
}

function tagProp(group: THREE.Object3D, propId: OfficeInteractionId) {
  group.userData.propId = propId;
  group.traverse((child) => {
    child.userData.propId = propId;
  });
}

function createWindowSkylineTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#091122");
    grad.addColorStop(0.5, "#15233B");
    grad.addColorStop(1, "#263B59");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    const horizonGlow = ctx.createRadialGradient(260, 220, 12, 260, 220, 220);
    horizonGlow.addColorStop(0, "rgba(16, 185, 129, 0.28)");
    horizonGlow.addColorStop(0.5, "rgba(56, 189, 248, 0.18)");
    horizonGlow.addColorStop(1, "rgba(9, 17, 34, 0)");
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, 512, 256);

    // Stars
    ctx.fillStyle = "rgba(248, 250, 252, 0.65)";
    for (let i = 0; i < 28; i++) {
      ctx.fillRect((i * 73) % 500, (i * 29) % 95, 2, 2);
    }

    // Jakarta Sudirman-style financial district towers
    const buildings = [
      [16, 114, 52, 142],
      [78, 72, 64, 184],
      [152, 124, 48, 132],
      [210, 54, 72, 202],
      [292, 98, 58, 158],
      [360, 58, 70, 198],
      [440, 108, 56, 148],
    ];
    buildings.forEach(([bx, by, bw, bh], bIdx) => {
      ctx.fillStyle = "#0B1324";
      ctx.fillRect(bx, by, bw, bh);
      // Rooftop beacon
      ctx.fillStyle = bIdx % 2 === 0 ? "#10B981" : "#38BDF8";
      ctx.fillRect(bx + bw * 0.35, by - 4, bw * 0.3, 4);

      for (let wy = by + 12; wy < 242; wy += 16) {
        for (let wx = bx + 8; wx < bx + bw - 10; wx += 13) {
          if ((wx * 7 + wy * 3) % 5 !== 0) {
            ctx.fillStyle =
              (wx + wy) % 3 === 0
                ? "rgba(251, 191, 36, 0.72)"
                : "rgba(56, 189, 248, 0.52)";
            ctx.fillRect(wx, wy, 7, 8);
          }
        }
      }
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTickerStripTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#080E1A";
    ctx.fillRect(0, 0, 1024, 64);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 1020, 60);

    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#10B981";
    ctx.fillText("● TESISLAB QUANT", 20, 40);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillText("USD/IDR 18.263", 285, 40);
    ctx.fillStyle = "#EF4444";
    ctx.fillText("IHSG -0.92%", 510, 40);
    ctx.fillStyle = "#F59E0B";
    ctx.fillText("XAU $3,539", 695, 40);
    ctx.fillStyle = "#38BDF8";
    ctx.fillText("DECIMAL <1MS", 855, 40);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createScreenTexture(
  title: string,
  accent: string,
  kind: "status" | "chart" | "board"
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = kind === "board" ? "#F8FAFC" : "#0B1322";
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = accent;
    ctx.fillRect(24, 20, 128, 10);

    ctx.fillStyle = kind === "board" ? "#0F172A" : "#F8FAFC";
    ctx.font = "bold 23px monospace";
    ctx.fillText(title, 24, 64);

    if (kind === "board") {
      const colors = ["#FDE047", "#6EE7B7", "#FCA5A5", "#93C5FD"];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = colors[(row * 4 + col) % colors.length];
          ctx.fillRect(28 + col * 114, 92 + row * 94, 94, 74);
          ctx.fillStyle = "rgba(15,23,42,0.32)";
          ctx.fillRect(38 + col * 114, 110 + row * 94, 64, 6);
          ctx.fillRect(38 + col * 114, 126 + row * 94, 46, 6);
        }
      }
    } else if (kind === "status") {
      ctx.fillStyle = "#94A3B8";
      ctx.font = "16px monospace";
      ctx.fillText("1,000 MONTE CARLO · BRIER CALIBRATION", 24, 94);

      // Grid lines
      ctx.strokeStyle = "rgba(148,163,184,0.14)";
      ctx.lineWidth = 1;
      for (let gy = 120; gy <= 280; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(24, gy);
        ctx.lineTo(488, gy);
        ctx.stroke();
      }

      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(28, 255);
      ctx.lineTo(105, 215);
      ctx.lineTo(185, 232);
      ctx.lineTo(270, 158);
      ctx.lineTo(355, 176);
      ctx.lineTo(445, 120);
      ctx.lineTo(486, 134);
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.18;
      ctx.lineTo(486, 282);
      ctx.lineTo(28, 282);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      const bars = [68, 116, 86, 152, 128, 174, 102, 144];
      bars.forEach((h, i) => {
        ctx.fillStyle = i % 3 === 0 ? "#EF4444" : accent;
        ctx.fillRect(30 + i * 56, 280 - h, 34, h);
      });
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ExecutiveAgentRig {
  id: StationId;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  bookMesh: THREE.Mesh;
  haloMat: THREE.MeshBasicMaterial;
  pos: THREE.Vector3;
  homePos: THREE.Vector3;
  meetingPos: THREE.Vector3;
  routineStops: AutonomousStop[];
  routineIdx: number;
  pauseTimer: number;
  walkPhase: number;
  pathQueue: THREE.Vector3[];
  pathGoalKey: string;
  arrived: boolean;
  commandTarget: THREE.Vector3 | null;
  commandLookAt: THREE.Vector3 | null;
  commandTimer: number;
  commandAction: "idle" | "present" | "meeting" | "coffee" | "wave" | "type" | "read" | "sit_desk";
  waveTimer: number;
}

const AGENT_SKIN_TONES: Record<StationId, number> = {
  hermes: 0xf1c2a0,
  data_analyst: 0xe8b490,
  risk_manager: 0xf3cab0,
  committee_chair: 0xdca580,
};

const AGENT_HAIR_TONES: Record<StationId, number> = {
  hermes: 0x1e293b,
  data_analyst: 0x292524,
  risk_manager: 0x3b2314,
  committee_chair: 0x475569,
};

/**
 * High-Craft Stylized 3D Executive Human Avatar:
 * - Natural sculpted head, expressive eyes, styled hair, tailored blazer & lapels
 * - Crisp dress shirt, role-colored silk tie, watch, articulated legs/shoes (supports sitting!)
 * - Optional held Dossier Book when reading reports or inspecting archives
 */
function createExecutiveAgent(
  id: StationId,
  accentHex: number,
  homePos: THREE.Vector3,
  meetingPos: THREE.Vector3,
  routineStops: AutonomousStop[]
): ExecutiveAgentRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.1,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.18,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: AGENT_SKIN_TONES[id],
    roughness: 0.52,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: AGENT_HAIR_TONES[id],
    roughness: 0.65,
    metalness: 0.05,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.25,
    metalness: 0.35,
  });

  // Subtle Floor Status Ring beneath feet
  const haloMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
  });
  const haloRing = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.27, 28),
    haloMat
  );
  haloRing.rotation.x = -Math.PI / 2;
  haloRing.position.y = 0.015;
  root.add(haloRing);

  // Articulated Legs + Dress Shoes (supports walking & sitting cleanly!)
  const makeLeg = (xOff: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOff, 0.33, 0);
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.062, 0.17, 8, 12),
      trouserMat
    );
    leg.position.y = -0.14;
    leg.castShadow = true;
    pivot.add(leg);

    const shoe = new THREE.Mesh(
      new RoundedBoxGeometry(0.105, 0.058, 0.175, 3, 0.02),
      shoeMat
    );
    shoe.position.set(0, -0.28, 0.03);
    shoe.castShadow = true;
    pivot.add(shoe);

    bodyGroup.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-0.085);
  const rightLeg = makeLeg(0.085);

  // Tailored Executive Blazer Torso + Lapels
  const torso = new THREE.Mesh(
    new RoundedBoxGeometry(0.32, 0.38, 0.21, 4, 0.06),
    suitMat
  );
  torso.position.y = 0.52;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Crisp White Shirt V + Role-Colored Silk Tie
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.19, 0.025),
    shirtMat
  );
  shirt.position.set(0, 0.58, 0.1);
  bodyGroup.add(shirt);

  const tie = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.21, 0.032),
    accentMat
  );
  tie.position.set(0, 0.54, 0.106);
  bodyGroup.add(tie);

  const lapelPin = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 10),
    accentMat
  );
  lapelPin.position.set(-0.085, 0.6, 0.108);
  bodyGroup.add(lapelPin);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.09, 12),
    skinMat
  );
  neck.position.set(0, 0.73, 0);
  bodyGroup.add(neck);

  // Articulated Blazer Sleeves + Natural Hands
  const makeArm = (xOff: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOff, 0.65, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.048, 0.18, 8, 12),
      suitMat
    );
    sleeve.position.y = -0.13;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.025, 10),
      shirtMat
    );
    cuff.position.y = -0.23;
    pivot.add(cuff);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 12, 12),
      skinMat
    );
    hand.position.y = -0.26;
    pivot.add(hand);

    bodyGroup.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-0.21);
  const rightArm = makeArm(0.21);

  // Dossier / Report Book held in right hand (visible when reading/auditing)
  const bookMesh = new THREE.Mesh(
    new RoundedBoxGeometry(0.18, 0.025, 0.24, 2, 0.006),
    new THREE.MeshStandardMaterial({
      color: accentHex,
      roughness: 0.4,
    })
  );
  bookMesh.position.set(-0.04, -0.26, 0.12);
  bookMesh.rotation.x = 0.4;
  bookMesh.visible = false;
  rightArm.add(bookMesh);

  // Realistic Stylized Human Head + Hair + Natural Eyes + Role Accessories
  const head = new THREE.Group();
  head.position.y = 0.9;

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 22, 20),
    skinMat
  );
  cranium.scale.set(0.95, 1.06, 0.98);
  cranium.castShadow = true;
  head.add(cranium);

  // Ears
  for (const side of [-1, 1] as const) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      skinMat
    );
    ear.position.set(side * 0.155, -0.01, 0);
    head.add(ear);
  }

  // Subtle nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.024, 10, 10),
    skinMat
  );
  nose.position.set(0, -0.02, 0.16);
  head.add(nose);

  // Expressive Eyes (Sclera + Dark Iris)
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const browMat = new THREE.MeshStandardMaterial({ color: AGENT_HAIR_TONES[id], roughness: 0.7 });
  for (const ex of [-0.056, 0.056]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), scleraMat);
    sclera.scale.set(1, 1.15, 0.5);
    sclera.position.set(ex, 0.015, 0.145);
    head.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), irisMat);
    iris.position.set(ex, 0.015, 0.156);
    head.add(iris);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.015), browMat);
    brow.position.set(ex, 0.052, 0.148);
    head.add(brow);
  }

  // Sculpted Executive Hair Crown + Side Sweep
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.172, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairCrown.scale.set(0.98, 1.04, 1.02);
  hairCrown.position.y = 0.025;
  hairCrown.rotation.x = -0.18;
  hairCrown.castShadow = true;
  head.add(hairCrown);

  const hairBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.28, 0.15, 0.14, 3, 0.06),
    hairMat
  );
  hairBack.position.set(0, 0.02, -0.09);
  head.add(hairBack);

  // Subtle Role Accessories (Professional Earpiece / Rim Glasses)
  if (id === "hermes") {
    const earpiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.02, 10),
      accentMat
    );
    earpiece.rotation.z = Math.PI / 2;
    earpiece.position.set(0.175, -0.01, 0.01);
    head.add(earpiece);
  } else if (id === "data_analyst" || id === "committee_chair") {
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.01, 0.015),
      shoeMat
    );
    bridge.position.set(0, 0.022, 0.165);
    head.add(bridge);
  }

  bodyGroup.add(head);

  root.position.copy(homePos);
  tagStation(root, id, "agent_wave");

  return {
    id,
    root,
    bodyGroup,
    head,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    bookMesh,
    haloMat,
    pos: homePos.clone(),
    homePos: homePos.clone(),
    meetingPos: meetingPos.clone(),
    routineStops,
    routineIdx: 0,
    pauseTimer: 0,
    walkPhase: Math.random() * Math.PI * 2,
    pathQueue: [],
    pathGoalKey: "",
    arrived: false,
    commandTarget: null,
    commandLookAt: null,
    commandTimer: 0,
    commandAction: "idle",
    waveTimer: 0,
  };
}

/**
 * Multi-Monitor Institutional Quant/Risk Trading Workstation:
 * - Wide main display + 2 angled side monitors
 * - Glowing desk task lamp + coffee mug + mechanical keyboard
 * - High-back ergonomic executive chair with armrests
 */
function createTradingWorkstation(opts: {
  woodMat: THREE.MeshStandardMaterial;
  woodDarkMat: THREE.MeshStandardMaterial;
  chairMat: THREE.MeshStandardMaterial;
  screenTex: THREE.CanvasTexture;
  accentColor: number;
  stationId: StationId;
}): THREE.Group {
  const g = new THREE.Group();

  const rug = new THREE.Mesh(
    new RoundedBoxGeometry(2.35, 0.02, 1.8, 2, 0.01),
    new THREE.MeshStandardMaterial({
      color: opts.accentColor,
      roughness: 0.9,
      transparent: true,
      opacity: 0.22,
    })
  );
  rug.position.y = 0.01;
  rug.receiveShadow = true;
  g.add(rug);

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(1.75, 0.075, 0.88, 2, 0.02),
    opts.woodMat
  );
  top.position.y = 0.58;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  for (const [lx, lz] of [
    [-0.76, -0.35],
    [0.76, -0.35],
    [-0.76, 0.35],
    [0.76, 0.35],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.56, 0.06),
      opts.woodDarkMat
    );
    leg.position.set(lx, 0.28, lz);
    leg.castShadow = true;
    g.add(leg);
  }

  // Center Primary Monitor
  const mainBezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.76, 0.44, 0.04, 2, 0.01),
    opts.chairMat
  );
  mainBezel.position.set(0, 0.91, -0.2);
  mainBezel.castShadow = true;
  g.add(mainBezel);

  const mainScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.38),
    new THREE.MeshBasicMaterial({ map: opts.screenTex })
  );
  mainScreen.position.set(0, 0.91, -0.175);
  g.add(mainScreen);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.16, 0.08),
    opts.chairMat
  );
  stand.position.set(0, 0.67, -0.2);
  g.add(stand);

  // Left & Right Angled Wing Monitors (Bloomberg Triple-Screen Setup)
  const sideScreenMat = new THREE.MeshStandardMaterial({
    color: 0x0b1322,
    emissive: opts.accentColor,
    emissiveIntensity: 0.24,
    roughness: 0.25,
  });
  for (const side of [-1, 1] as const) {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(side * 0.56, 0.89, -0.11);
    wingGroup.rotation.y = -side * 0.38;

    const wingBezel = new THREE.Mesh(
      new RoundedBoxGeometry(0.42, 0.38, 0.035, 2, 0.01),
      opts.chairMat
    );
    wingBezel.castShadow = true;
    wingGroup.add(wingBezel);

    const wingFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.37, 0.33),
      sideScreenMat
    );
    wingFace.position.z = 0.02;
    wingGroup.add(wingFace);
    g.add(wingGroup);
  }

  // Desk Task Lamp + Keyboard + Mug
  const kb = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.02, 0.16, 2, 0.005),
    opts.chairMat
  );
  kb.position.set(0, 0.63, 0.15);
  g.add(kb);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.09, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  mug.position.set(0.58, 0.66, 0.18);
  g.add(mug);

  // Executive Ergonomic Chair behind desk
  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.07, 0.48, 2, 0.02),
    opts.chairMat
  );
  seat.position.set(0, 0.36, 0.62);
  seat.castShadow = true;
  g.add(seat);

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(0.48, 0.52, 0.07, 2, 0.02),
    opts.chairMat
  );
  back.position.set(0, 0.64, 0.84);
  back.castShadow = true;
  g.add(back);

  const chairStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.34, 8),
    opts.chairMat
  );
  chairStem.position.set(0, 0.18, 0.62);
  g.add(chairStem);

  tagStation(g, opts.stationId);
  return g;
}

function createLaptopProp(accentColor: number): {
  group: THREE.Group;
  screenMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.45,
  });
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(0.28, 0.016, 0.2, 2, 0.005),
    chassisMat
  );
  group.add(base);

  const screenPivot = new THREE.Group();
  screenPivot.position.set(0, 0.008, -0.095);
  screenPivot.rotation.x = -0.32;

  const lid = new THREE.Mesh(
    new RoundedBoxGeometry(0.28, 0.19, 0.012, 2, 0.005),
    chassisMat
  );
  lid.position.set(0, 0.095, 0);
  screenPivot.add(lid);

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0b1322,
    emissive: accentColor,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.16), screenMat);
  display.position.set(0, 0.095, 0.007);
  screenPivot.add(display);

  group.add(screenPivot);
  return { group, screenMat };
}

function createPottedPlant(scale = 1): {
  group: THREE.Group;
  canopy: THREE.Group;
} {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19 * scale, 0.14 * scale, 0.3 * scale, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
  );
  pot.position.y = 0.15 * scale;
  pot.castShadow = true;
  g.add(pot);

  const canopy = new THREE.Group();
  canopy.position.y = 0.28 * scale;
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.62,
  });
  const leafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.68,
  });
  const offsets: [number, number, number, number, boolean][] = [
    [0, 0.16 * scale, 0, 0.21 * scale, false],
    [-0.12 * scale, 0.11 * scale, 0.08 * scale, 0.15 * scale, true],
    [0.13 * scale, 0.13 * scale, -0.07 * scale, 0.16 * scale, false],
    [0.02 * scale, 0.31 * scale, 0.02 * scale, 0.14 * scale, true],
    [-0.08 * scale, 0.24 * scale, -0.08 * scale, 0.12 * scale, false],
  ];
  offsets.forEach(([x, y, z, r, dark]) => {
    const foliage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(r, 1),
      dark ? leafDarkMat : leafMat
    );
    foliage.position.set(x, y, z);
    foliage.castShadow = true;
    canopy.add(foliage);
  });
  g.add(canopy);
  return { group: g, canopy };
}

export default function WarRoom3DCanvas({
  theme,
  auditPhase,
  activeAgent,
  verdictStatus,
  liveRiskScore,
  macroOrigin,
  selectedStation,
  onSelectStation,
  onOfficeInteract,
  externalCommand,
  simSpeed = 1,
  stationLabels,
  fallbackText,
}: WarRoom3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pinRefs = useRef<Record<StationId, HTMLButtonElement | null>>({
    hermes: null,
    data_analyst: null,
    risk_manager: null,
    committee_chair: null,
  });
  const statusSpanRefs = useRef<Record<StationId, HTMLSpanElement | null>>({
    hermes: null,
    data_analyst: null,
    risk_manager: null,
    committee_chair: null,
  });

  const [webglError, setWebglError] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>("panorama");

  const cameraGoalPosRef = useRef<THREE.Vector3 | null>(null);
  const cameraGoalTargetRef = useRef<THREE.Vector3>(
    new THREE.Vector3(...CAMERA_PRESETS.panorama.target)
  );
  const zoomDeltaRef = useRef<number>(0);

  const dispatchInteractionRef = useRef<
    ((interaction: OfficeInteractionId, hitStation?: StationId) => void) | null
  >(null);

  const handleSelectCameraPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    if (preset !== "follow") {
      const cfg = CAMERA_PRESETS[preset];
      cameraGoalPosRef.current = new THREE.Vector3(...cfg.pos);
      cameraGoalTargetRef.current = new THREE.Vector3(...cfg.target);
    }
  };

  const handleZoomStep = (dir: -1 | 1) => {
    zoomDeltaRef.current = dir * 1.35;
  };

  const onSelectRef = useRef(onSelectStation);
  useEffect(() => {
    onSelectRef.current = onSelectStation;
  }, [onSelectStation]);

  const onInteractRef = useRef(onOfficeInteract);
  useEffect(() => {
    onInteractRef.current = onOfficeInteract;
  }, [onOfficeInteract]);

  useEffect(() => {
    if (externalCommand && dispatchInteractionRef.current) {
      dispatchInteractionRef.current(externalCommand.interaction);
    }
  }, [externalCommand]);

  const stateRef = useRef<DynamicStateRef>({
    theme,
    auditPhase,
    activeAgent,
    verdictStatus,
    liveRiskScore,
    macroOrigin,
    selectedStation,
    simSpeed,
    cameraPreset,
  });

  const themeRefs = useRef<{
    scene?: THREE.Scene;
    floorMat?: THREE.MeshStandardMaterial;
    wallMat?: THREE.MeshStandardMaterial;
    trimMat?: THREE.MeshStandardMaterial;
    woodMat?: THREE.MeshStandardMaterial;
    woodDarkMat?: THREE.MeshStandardMaterial;
    chairMat?: THREE.MeshStandardMaterial;
    shelfMat?: THREE.MeshStandardMaterial;
    rugRoundMat?: THREE.MeshStandardMaterial;
    hemiLight?: THREE.HemisphereLight;
    sunLight?: THREE.DirectionalLight;
    fillLight?: THREE.DirectionalLight;
    bloomEffect?: BloomEffect;
  }>({});

  useEffect(() => {
    stateRef.current.theme = theme;
    stateRef.current.auditPhase = auditPhase;
    stateRef.current.activeAgent = activeAgent;
    stateRef.current.verdictStatus = verdictStatus;
    stateRef.current.liveRiskScore = liveRiskScore;
    stateRef.current.macroOrigin = macroOrigin;
    stateRef.current.selectedStation = selectedStation;
    stateRef.current.simSpeed = simSpeed;
    stateRef.current.cameraPreset = cameraPreset;

    const pal = OFFICE_PALETTES[theme];
    const refs = themeRefs.current;
    if (refs.scene) refs.scene.background = new THREE.Color(pal.canvasBg);
    if (refs.floorMat) refs.floorMat.color.setHex(pal.floor);
    if (refs.wallMat) refs.wallMat.color.setHex(pal.wall);
    if (refs.trimMat) refs.trimMat.color.setHex(pal.wallTrim);
    if (refs.woodMat) refs.woodMat.color.setHex(pal.wood);
    if (refs.woodDarkMat) refs.woodDarkMat.color.setHex(pal.woodDark);
    if (refs.chairMat) refs.chairMat.color.setHex(pal.chairMat);
    if (refs.shelfMat) refs.shelfMat.color.setHex(pal.shelfMat);
    if (refs.rugRoundMat) refs.rugRoundMat.color.setHex(pal.rugRound);
    if (refs.hemiLight) {
      refs.hemiLight.color.setHex(pal.hemiSky);
      refs.hemiLight.groundColor.setHex(pal.hemiGround);
      refs.hemiLight.intensity = pal.hemiIntensity;
    }
    if (refs.sunLight) refs.sunLight.intensity = pal.sunIntensity;
    if (refs.fillLight) refs.fillLight.intensity = pal.fillIntensity;
    if (refs.bloomEffect) refs.bloomEffect.intensity = pal.bloomIntensity;
  }, [
    theme,
    auditPhase,
    activeAgent,
    verdictStatus,
    liveRiskScore,
    macroOrigin,
    selectedStation,
    simSpeed,
    cameraPreset,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      const tId = setTimeout(() => setWebglError(true), 0);
      return () => clearTimeout(tId);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const initialPal = OFFICE_PALETTES[stateRef.current.theme];
    scene.background = new THREE.Color(initialPal.canvasBg);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.7;

    // Balanced Executive Isometric Framing — Zero Bottom Clipping!
    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.panorama.pos);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomEffect = new BloomEffect({
      intensity: initialPal.bloomIntensity,
      luminanceThreshold: 0.85,
      mipmapBlur: true,
    });
    const effectPass = new EffectPass(camera, bloomEffect);
    composer.addPass(renderPass);
    composer.addPass(effectPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enableZoom = true;
    controls.minDistance = 4.8;
    controls.maxDistance = 16.5;
    controls.enablePan = true;
    controls.minPolarAngle = Math.PI / 7;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(...CAMERA_PRESETS.panorama.target);
    controls.update();
    renderer.domElement.style.touchAction = "pan-y";

    const hemiLight = new THREE.HemisphereLight(
      initialPal.hemiSky,
      initialPal.hemiGround,
      initialPal.hemiIntensity
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      0xfffbeb,
      initialPal.sunIntensity
    );
    sunLight.position.set(-6, 11.5, 5.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 28;
    sunLight.shadow.camera.left = -7;
    sunLight.shadow.camera.right = 7;
    sunLight.shadow.camera.top = 7;
    sunLight.shadow.camera.bottom = -7;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(
      0xdbeafe,
      initialPal.fillIntensity
    );
    fillLight.position.set(7.5, 6.5, -4);
    scene.add(fillLight);

    const screenGlowLight = new THREE.PointLight(0x38bdf8, 1.5, 7);
    screenGlowLight.position.set(1.6, 1.9, -2.5);
    scene.add(screenGlowLight);

    const tableGlowLight = new THREE.PointLight(0x10b981, 1.25, 5.5);
    tableGlowLight.position.set(1.65, 1.4, 1.65);
    scene.add(tableGlowLight);

    const floorMat = new THREE.MeshStandardMaterial({
      color: initialPal.floor,
      roughness: 0.82,
      metalness: 0.06,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: initialPal.wall,
      roughness: 0.86,
      metalness: 0.03,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: initialPal.wallTrim,
      roughness: 0.68,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: initialPal.wood,
      roughness: 0.58,
      metalness: 0.05,
    });
    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: initialPal.woodDark,
      roughness: 0.7,
    });
    const chairMat = new THREE.MeshStandardMaterial({
      color: initialPal.chairMat,
      roughness: 0.52,
      metalness: 0.18,
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      color: initialPal.shelfMat,
      roughness: 0.65,
    });
    const rugRoundMat = new THREE.MeshStandardMaterial({
      color: initialPal.rugRound,
      roughness: 0.9,
    });

    themeRefs.current = {
      scene,
      floorMat,
      wallMat,
      trimMat,
      woodMat,
      woodDarkMat,
      chairMat,
      shelfMat,
      rugRoundMat,
      hemiLight,
      sunLight,
      fillLight,
      bloomEffect,
    };

    // === 1. Architectural Floor, Subtle Grid & L-Walls (Clean Slate Floor — Zero Stray Floor Cables) ===
    const floor = new THREE.Mesh(
      new RoundedBoxGeometry(9.8, 0.24, 8.2, 2, 0.03),
      floorMat
    );
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(9.4, 16, 0x334155, 0x1e293b);
    floorGrid.position.y = 0.004;
    if (Array.isArray(floorGrid.material)) {
      floorGrid.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.12;
      });
    } else {
      floorGrid.material.transparent = true;
      floorGrid.material.opacity = 0.12;
    }
    scene.add(floorGrid);

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(9.8, 2.85, 0.22),
      wallMat
    );
    backWall.position.set(0, 1.425, -4.0);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 2.85, 8.2),
      wallMat
    );
    leftWall.position.set(-4.8, 1.425, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Wall-Wide Bloomberg Live Market LED Ticker Ribbon along top of Back Wall
    const tickerTex = createTickerStripTexture();
    const tickerBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 0.34),
      new THREE.MeshBasicMaterial({ map: tickerTex })
    );
    tickerBanner.position.set(0.2, 2.48, -3.87);
    scene.add(tickerBanner);

    // Panoramic Jakarta Skyline Window on Left Wall
    const skylineTex = createWindowSkylineTexture();
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.65),
      new THREE.MeshBasicMaterial({ map: skylineTex })
    );
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-4.67, 1.48, 0.25);
    scene.add(windowGlass);

    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.75, 3.52),
      trimMat
    );
    windowFrame.position.set(-4.71, 1.48, 0.25);
    scene.add(windowFrame);

    for (const mz of [-0.65, 0.25, 1.15]) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.66, 0.045),
        trimMat
      );
      mullion.position.set(-4.66, 1.48, mz);
      scene.add(mullion);
    }

    // === 2. Interactive Screens & Stations ===
    const boardTex = createScreenTexture("PRE-MORTEM BOARD", "#10B981", "board");
    const statusTex = createScreenTexture("AUDIT STATUS", "#38BDF8", "status");
    const quantTex = createScreenTexture("QUANT ENGINE", "#10B981", "chart");
    const riskTex = createScreenTexture("RISK MATRIX", "#EF4444", "chart");

    const whiteboardGroup = new THREE.Group();
    const whiteboardFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.35, 1.28, 0.06, 2, 0.015),
      trimMat
    );
    whiteboardFrame.position.set(-0.25, 1.42, -3.86);
    whiteboardGroup.add(whiteboardFrame);

    const whiteboardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.22, 1.16),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    whiteboardFace.position.set(-0.25, 1.42, -3.82);
    whiteboardGroup.add(whiteboardFace);
    tagProp(whiteboardGroup, "whiteboard");
    scene.add(whiteboardGroup);

    const wallScreenGroup = new THREE.Group();
    const wallScreenFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.35, 1.32, 0.07, 2, 0.02),
      chairMat
    );
    wallScreenFrame.position.set(2.65, 1.42, -3.86);
    wallScreenGroup.add(wallScreenFrame);

    const wallScreenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.2),
      new THREE.MeshBasicMaterial({ map: statusTex })
    );
    wallScreenFace.position.set(2.65, 1.42, -3.815);
    wallScreenGroup.add(wallScreenFace);
    tagProp(wallScreenGroup, "wall_screen");
    scene.add(wallScreenGroup);

    // Espresso Lounge & Water Cooler (Front-Left Corner)
    const coffeeBarGroup = new THREE.Group();
    coffeeBarGroup.position.set(-3.85, 0, 2.75);
    const coffeeCounter = new THREE.Mesh(
      new RoundedBoxGeometry(0.92, 0.74, 1.32, 2, 0.03),
      woodMat
    );
    coffeeCounter.position.y = 0.37;
    coffeeCounter.castShadow = true;
    coffeeCounter.receiveShadow = true;
    coffeeBarGroup.add(coffeeCounter);

    const espressoBody = new THREE.Mesh(
      new RoundedBoxGeometry(0.38, 0.38, 0.4, 2, 0.02),
      chairMat
    );
    espressoBody.position.set(-0.08, 0.92, -0.22);
    espressoBody.castShadow = true;
    coffeeBarGroup.add(espressoBody);

    // Rising Steam Orbs over Espresso Bar
    const steamOrbs: THREE.Mesh[] = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.38,
    });
    for (let s = 0; s < 3; s++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), steamMat);
      orb.position.set(0.1, 0.92 + s * 0.12, 0.22);
      coffeeBarGroup.add(orb);
      steamOrbs.push(orb);
    }

    for (const [mx, mz, col] of [
      [0.14, 0.22, 0xf8fafc],
      [0.05, 0.4, 0x10b981],
    ] as const) {
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.048, 0.11, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
      );
      mug.position.set(mx, 0.79, mz);
      mug.castShadow = true;
      coffeeBarGroup.add(mug);
    }
    tagProp(coffeeBarGroup, "coffee_bar");
    scene.add(coffeeBarGroup);

    // HERMES Dual Server Rack (Back-Left Data Center)
    const hermesRack = new THREE.Group();
    hermesRack.position.set(-3.25, 0, -2.75);
    const rackBody = new THREE.Mesh(
      new RoundedBoxGeometry(1.05, 1.56, 0.76, 2, 0.03),
      chairMat
    );
    rackBody.position.y = 0.78;
    rackBody.castShadow = true;
    rackBody.receiveShadow = true;
    hermesRack.add(rackBody);

    const hermesLedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
    });
    for (let i = 0; i < 5; i++) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.042, 0.03),
        hermesLedMat
      );
      strip.position.set(0, 0.28 + i * 0.26, 0.39);
      hermesRack.add(strip);
    }
    tagStation(hermesRack, "hermes", "hermes_rack");
    scene.add(hermesRack);

    // Financial Archives Bookshelf (Clickable!)
    const bookshelfGroup = new THREE.Group();
    bookshelfGroup.position.set(-1.95, 0, -3.35);
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(1.0, 1.15, 0.38, 2, 0.02),
      shelfMat
    );
    shelf.position.set(0, 0.575, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    bookshelfGroup.add(shelf);

    const bookColors = [0x10b981, 0x38bdf8, 0xf59e0b, 0xef4444, 0x6366f1];
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.29, 0.25),
        new THREE.MeshStandardMaterial({
          color: bookColors[i],
          roughness: 0.6,
        })
      );
      book.position.set(-0.29 + i * 0.145, 0.85, 0.03);
      bookshelfGroup.add(book);
    }
    tagProp(bookshelfGroup, "bookshelf");
    scene.add(bookshelfGroup);

    // Wall Analog Market Clock with Live Moving Hands (Left Wall above Bookshelf)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-1.95, 2.02, -3.86);
    const clockDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 })
    );
    clockDial.rotation.x = Math.PI / 2;
    clockGroup.add(clockDial);
    const clockRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.018, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.4 })
    );
    clockRim.position.z = 0.02;
    clockGroup.add(clockRim);
    const clockHandPivot = new THREE.Group();
    clockHandPivot.position.z = 0.03;
    const clockSecondHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.16, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    clockSecondHand.position.y = 0.07;
    clockHandPivot.add(clockSecondHand);
    clockGroup.add(clockHandPivot);
    scene.add(clockGroup);

    // 5 Lush Animated Studio Plants (Swaying in AC Breeze)
    const plantCanopies: { canopy: THREE.Group; phase: number }[] = [];
    (
      [
        [-3.85, -1.2, 1.05],
        [4.05, -3.1, 1.15],
        [-3.65, 1.7, 0.92],
        [3.95, 2.85, 1.12],
        [0.45, -3.4, 0.85],
      ] as [number, number, number][]
    ).forEach(([px, pz, sc], idx) => {
      const { group: plant, canopy } = createPottedPlant(sc);
      plant.position.set(px, 0, pz);
      scene.add(plant);
      plantCanopies.push({ canopy, phase: idx * 1.3 });
    });

    // Ambient Floating Data Motes in Studio Air
    const moteCount = 48;
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = ((i * 37) % 84) / 10 - 4.2;
      motePos[i * 3 + 1] = 0.4 + ((i * 19) % 21) / 10;
      motePos[i * 3 + 2] = ((i * 53) % 70) / 10 - 3.5;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.36,
    });
    const studioMotes = new THREE.Points(moteGeo, moteMat);
    scene.add(studioMotes);

    // Workstation 1: QUANT Triple-Monitor Desk
    const quantDesk = createTradingWorkstation({
      woodMat,
      woodDarkMat,
      chairMat,
      screenTex: quantTex,
      accentColor: 0x10b981,
      stationId: "data_analyst",
    });
    quantDesk.position.set(-1.95, 0, 1.15);
    quantDesk.rotation.y = 0.16;
    tagStation(quantDesk, "data_analyst", "quant_desk");
    scene.add(quantDesk);

    // Workstation 2: RISK Triple-Monitor Desk
    const riskDesk = createTradingWorkstation({
      woodMat,
      woodDarkMat,
      chairMat,
      screenTex: riskTex,
      accentColor: 0xef4444,
      stationId: "risk_manager",
    });
    riskDesk.position.set(2.25, 0, -1.35);
    riskDesk.rotation.y = -0.22;
    tagStation(riskDesk, "risk_manager", "risk_desk");
    scene.add(riskDesk);

    // Executive Glass-Accent Conference Table + Spinning 3D Holographic Risk Crystal!
    const meetingGroup = new THREE.Group();
    meetingGroup.position.set(1.55, 0, 1.55);

    const roundRug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.55, 0.02, 36),
      rugRoundMat
    );
    roundRug.position.y = 0.01;
    roundRug.receiveShadow = true;
    meetingGroup.add(roundRug);

    const roundTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 0.88, 0.075, 32),
      woodMat
    );
    roundTop.position.y = 0.56;
    roundTop.castShadow = true;
    roundTop.receiveShadow = true;
    meetingGroup.add(roundTop);

    const roundLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.28, 0.54, 18),
      woodDarkMat
    );
    roundLeg.position.y = 0.27;
    roundLeg.castShadow = true;
    meetingGroup.add(roundLeg);

    // 4 Conference Chairs around Round Table
    [0.4, 1.95, 3.55, 5.1].forEach((angle) => {
      const cx = Math.cos(angle) * 1.16;
      const cz = Math.sin(angle) * 1.16;
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 0, cz);
      cGroup.rotation.y = Math.atan2(-cx, -cz);

      const cSeat = new THREE.Mesh(
        new RoundedBoxGeometry(0.4, 0.06, 0.4, 2, 0.02),
        chairMat
      );
      cSeat.position.y = 0.32;
      cSeat.castShadow = true;
      cGroup.add(cSeat);

      const cBack = new THREE.Mesh(
        new RoundedBoxGeometry(0.38, 0.36, 0.06, 2, 0.02),
        chairMat
      );
      cBack.position.set(0, 0.52, -0.18);
      cBack.castShadow = true;
      cGroup.add(cBack);

      const cBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8),
        chairMat
      );
      cBase.position.y = 0.15;
      cGroup.add(cBase);

      meetingGroup.add(cGroup);
    });

    // Verdict Status Ring + Floating 3D Holographic Risk Crystal above Table!
    const verdictRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.75,
      roughness: 0.2,
    });
    const tableRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.024, 12, 36),
      verdictRingMat
    );
    tableRing.rotation.x = Math.PI / 2;
    tableRing.position.y = 0.61;
    meetingGroup.add(tableRing);

    const holoCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      verdictRingMat
    );
    holoCrystal.position.y = 0.94;
    meetingGroup.add(holoCrystal);

    const holoOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.012, 8, 28),
      verdictRingMat
    );
    holoOrbit.position.y = 0.94;
    meetingGroup.add(holoOrbit);

    // Live Glowing Laptops on Conference Table!
    const tableLaptops: THREE.MeshStandardMaterial[] = [];
    for (const [lx, lz, rotY, col] of [
      [-0.45, -0.22, 0.55, 0x10b981],
      [0.44, 0.26, -2.55, 0x38bdf8],
    ] as const) {
      const { group: laptop, screenMat } = createLaptopProp(col);
      laptop.position.set(lx, 0.61, lz);
      laptop.rotation.y = rotY;
      meetingGroup.add(laptop);
      tableLaptops.push(screenMat);
    }

    tagStation(meetingGroup, "committee_chair", "meeting_table");
    scene.add(meetingGroup);

    // === 3. Four Autonomous Executive AI Agents (Exact Chair Seats & Non-Overlapping Meeting Chairs) ===
    // Conference chairs sit at angles [0.4, 1.95, 3.55, 5.1] around (1.55, 1.55) at radius 1.18
    const meetingSeat = (angle: number) =>
      new THREE.Vector3(
        1.55 + Math.cos(angle) * 1.18,
        0,
        1.55 + Math.sin(angle) * 1.18
      );

    const agents: Record<StationId, ExecutiveAgentRig> = {
      hermes: createExecutiveAgent(
        "hermes",
        AGENT_COLORS.hermes,
        new THREE.Vector3(-2.35, 0, -2.05),
        meetingSeat(3.55), // Back-left conference chair
        [
          {
            pos: new THREE.Vector3(-2.35, 0, -2.05),
            lookAt: new THREE.Vector3(-3.25, 0.85, -2.75),
            action: "type",
            dwell: 5.5,
          },
          {
            pos: new THREE.Vector3(2.35, 0, -2.85),
            lookAt: new THREE.Vector3(2.65, 1.4, -3.82),
            action: "present",
            dwell: 4.5,
          },
          {
            pos: new THREE.Vector3(-2.85, 0, 2.55),
            lookAt: new THREE.Vector3(-3.85, 0.8, 2.75),
            action: "coffee",
            dwell: 3.5,
          },
        ]
      ),
      data_analyst: createExecutiveAgent(
        "data_analyst",
        AGENT_COLORS.data_analyst,
        new THREE.Vector3(-1.85, 0, 1.76),
        meetingSeat(1.95), // Front-left conference chair
        [
          {
            pos: new THREE.Vector3(-1.85, 0, 1.76),
            lookAt: new THREE.Vector3(-1.95, 0.9, 1.0),
            action: "sit_desk",
            dwell: 7.0,
          },
          {
            pos: new THREE.Vector3(-0.55, 0, -2.85),
            lookAt: new THREE.Vector3(-0.25, 1.4, -3.82),
            action: "present",
            dwell: 4.5,
          },
          {
            pos: new THREE.Vector3(-1.85, 0, -2.65),
            lookAt: new THREE.Vector3(-1.95, 0.85, -3.35),
            action: "read",
            dwell: 4.5,
          },
        ]
      ),
      risk_manager: createExecutiveAgent(
        "risk_manager",
        AGENT_COLORS.risk_manager,
        new THREE.Vector3(2.11, 0, -0.74),
        meetingSeat(5.1), // Back-right conference chair
        [
          {
            pos: new THREE.Vector3(2.11, 0, -0.74),
            lookAt: new THREE.Vector3(2.25, 0.9, -1.5),
            action: "sit_desk",
            dwell: 7.0,
          },
          {
            pos: new THREE.Vector3(0.35, 0, -2.85),
            lookAt: new THREE.Vector3(-0.25, 1.4, -3.82),
            action: "present",
            dwell: 4.5,
          },
          {
            pos: new THREE.Vector3(-2.85, 0, 2.55),
            lookAt: new THREE.Vector3(-3.85, 0.8, 2.75),
            action: "coffee",
            dwell: 3.5,
          },
        ]
      ),
      committee_chair: createExecutiveAgent(
        "committee_chair",
        AGENT_COLORS.committee_chair,
        meetingSeat(0.4), // Front-right conference chair
        meetingSeat(0.4),
        [
          {
            pos: meetingSeat(0.4),
            lookAt: new THREE.Vector3(1.55, 0.7, 1.55),
            action: "read",
            dwell: 6.5,
          },
          {
            pos: new THREE.Vector3(-1.95, 0, -2.65),
            lookAt: new THREE.Vector3(-1.95, 0.85, -3.35),
            action: "read",
            dwell: 5.0,
          },
          {
            pos: new THREE.Vector3(2.95, 0, -2.85),
            lookAt: new THREE.Vector3(2.65, 1.4, -3.82),
            action: "present",
            dwell: 4.5,
          },
        ]
      ),
    };

    Object.values(agents).forEach((ag) => scene.add(ag.root));

    const interactiveRoots = [
      whiteboardGroup,
      wallScreenGroup,
      coffeeBarGroup,
      hermesRack,
      bookshelfGroup,
      quantDesk,
      riskDesk,
      meetingGroup,
      ...Object.values(agents).map((a) => a.root),
    ];

    const dispatchInteraction = (
      interaction: OfficeInteractionId,
      hitStation?: StationId
    ) => {
      const assignCmd = (
        id: StationId,
        target: THREE.Vector3,
        lookAt: THREE.Vector3,
        action: ExecutiveAgentRig["commandAction"],
        duration: number
      ) => {
        const ag = agents[id];
        ag.commandTarget = target.clone();
        ag.commandLookAt = lookAt.clone();
        ag.commandAction = action;
        ag.commandTimer = duration;
        ag.pauseTimer = 0;
      };

      let primaryActor: StationId = hitStation ?? stateRef.current.selectedStation;

      if (interaction === "whiteboard") {
        primaryActor = "data_analyst";
        assignCmd(
          "data_analyst",
          new THREE.Vector3(-0.7, 0, -2.75),
          new THREE.Vector3(-0.25, 1.4, -3.82),
          "present",
          8.0
        );
        assignCmd(
          "risk_manager",
          new THREE.Vector3(0.3, 0, -2.75),
          new THREE.Vector3(-0.25, 1.4, -3.82),
          "present",
          8.0
        );
      } else if (interaction === "wall_screen") {
        primaryActor = "hermes";
        assignCmd(
          "hermes",
          new THREE.Vector3(2.15, 0, -2.75),
          new THREE.Vector3(2.65, 1.4, -3.82),
          "present",
          8.0
        );
        assignCmd(
          "committee_chair",
          new THREE.Vector3(3.1, 0, -2.75),
          new THREE.Vector3(2.65, 1.4, -3.82),
          "present",
          8.0
        );
      } else if (interaction === "meeting_table") {
        primaryActor = "committee_chair";
        STATION_IDS.forEach((id) => {
          assignCmd(
            id,
            agents[id].meetingPos,
            new THREE.Vector3(1.55, 0.7, 1.55),
            "meeting",
            9.0
          );
        });
      } else if (interaction === "coffee_bar") {
        const actor = stateRef.current.selectedStation;
        primaryActor = actor;
        assignCmd(
          actor,
          new THREE.Vector3(-2.85, 0, 2.65),
          new THREE.Vector3(-3.85, 0.8, 2.75),
          "coffee",
          7.0
        );
      } else if (interaction === "hermes_rack") {
        primaryActor = "hermes";
        assignCmd(
          "hermes",
          new THREE.Vector3(-2.35, 0, -2.25),
          new THREE.Vector3(-3.25, 0.85, -2.75),
          "type",
          7.0
        );
      } else if (interaction === "quant_desk") {
        primaryActor = "data_analyst";
        assignCmd(
          "data_analyst",
          new THREE.Vector3(-1.85, 0, 1.76),
          new THREE.Vector3(-1.95, 0.9, 1.0),
          "sit_desk",
          8.0
        );
      } else if (interaction === "risk_desk") {
        primaryActor = "risk_manager";
        assignCmd(
          "risk_manager",
          new THREE.Vector3(2.11, 0, -0.74),
          new THREE.Vector3(2.25, 0.9, -1.5),
          "sit_desk",
          8.0
        );
      } else if (interaction === "bookshelf") {
        primaryActor = "committee_chair";
        assignCmd(
          "committee_chair",
          new THREE.Vector3(-1.95, 0, -2.65),
          new THREE.Vector3(-1.95, 0.85, -3.35),
          "read",
          8.0
        );
      } else if (interaction === "agent_wave" && hitStation) {
        primaryActor = hitStation;
        agents[hitStation].waveTimer = 1.8;
      }

      onSelectRef.current(primaryActor);
      onInteractRef.current?.(interaction, primaryActor);
    };
    dispatchInteractionRef.current = dispatchInteraction;

    const projectedVec = new THREE.Vector3();

    let viewW = 1;
    let viewH = 1;
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      viewW = w;
      viewH = h;
      const aspect = w / h;
      camera.aspect = aspect;
      // Widen FOV slightly on narrow mobile screens so the entire studio stays framed
      camera.fov = aspect < 1.1 ? 42 : aspect < 1.5 ? 37 : 34;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    let pointerDownPos = { x: 0, y: 0 };

    const getHitUnderPointer = (
      e: PointerEvent
    ): { stationId?: StationId; propId?: OfficeInteractionId } | null => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactiveRoots, true);
      for (const hit of hits) {
        const sid = hit.object.userData.stationId as StationId | undefined;
        const pid = hit.object.userData.propId as
          | OfficeInteractionId
          | undefined;
        if (sid || pid) return { stationId: sid, propId: pid };
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = getHitUnderPointer(e);
      canvas.style.cursor = hit ? "pointer" : "grab";
    };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      cameraGoalPosRef.current = null;
    };
    const onPointerUp = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx < 6 && dy < 6) {
        const hit = getHitUnderPointer(e);
        if (hit?.propId) {
          dispatchInteraction(hit.propId, hit.stationId);
        } else if (hit?.stationId) {
          dispatchInteraction("agent_wave", hit.stationId);
        }
      }
    };
    const onPointerLeave = () => {
      canvas.style.cursor = "default";
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let disposed = false;
    let isInView = true;
    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const animate = (now: number) => {
      if (disposed || !isInView || document.hidden) {
        rafId = 0;
        return;
      }
      rafId = window.requestAnimationFrame(animate);
      const rawDt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;

      const st = stateRef.current;
      const dt = rawDt * st.simSpeed;
      const elapsed = Math.max(0, (now - startTime) / 1000);

      // Step Zoom if clicked
      if (zoomDeltaRef.current !== 0) {
        const offset = camera.position.clone().sub(controls.target);
        const nextLen = Math.max(
          controls.minDistance,
          Math.min(controls.maxDistance, offset.length() - zoomDeltaRef.current)
        );
        offset.setLength(nextLen);
        cameraGoalPosRef.current = controls.target.clone().add(offset);
        zoomDeltaRef.current = 0;
      }

      // Follow-Agent Camera Mode vs Fixed Balanced Presets
      if (st.cameraPreset === "follow") {
        const followed = agents[st.selectedStation];
        cameraGoalTargetRef.current.set(
          followed.pos.x,
          0.75,
          followed.pos.z
        );
      }

      if (cameraGoalPosRef.current) {
        camera.position.lerp(cameraGoalPosRef.current, reducedMotion ? 1 : 0.085);
        if (camera.position.distanceTo(cameraGoalPosRef.current) < 0.05) {
          camera.position.copy(cameraGoalPosRef.current);
          cameraGoalPosRef.current = null;
        }
      }

      controls.target.lerp(
        cameraGoalTargetRef.current,
        reducedMotion ? 1 : 0.075
      );
      controls.update();

      // Animate Holographic Crystal & Coffee Steam
      const ringColor =
        st.auditPhase === "verdict"
          ? st.verdictStatus === "REJECTED"
            ? 0xef4444
            : st.verdictStatus === "CONDITIONAL"
              ? 0xf59e0b
              : 0x10b981
          : typeof st.liveRiskScore === "number"
            ? st.liveRiskScore < 50
              ? 0xef4444
              : st.liveRiskScore < 75
                ? 0xf59e0b
                : 0x10b981
            : 0x10b981;

      verdictRingMat.color.setHex(ringColor);
      verdictRingMat.emissive.setHex(ringColor);
      verdictRingMat.emissiveIntensity =
        0.55 + 0.25 * Math.sin(elapsed * (ringColor === 0xef4444 ? 6 : 2.5));
      tableGlowLight.color.setHex(ringColor);

      holoCrystal.rotation.y = elapsed * 1.15;
      holoCrystal.position.y = 0.94 + Math.sin(elapsed * 2.4) * 0.05;
      holoOrbit.rotation.x = Math.PI / 3 + elapsed * 0.7;
      holoOrbit.rotation.y = elapsed * 0.9;

      steamOrbs.forEach((orb, idx) => {
        const cycle = (elapsed * 0.55 + idx * 0.33) % 1;
        orb.position.y = 0.88 + cycle * 0.36;
        orb.scale.setScalar(1 - cycle * 0.5);
      });

      const hermesColor =
        st.macroOrigin === "remote_data_feed" ? 0x10b981 : 0x38bdf8;
      hermesLedMat.color.setHex(hermesColor);
      hermesLedMat.emissive.setHex(hermesColor);
      hermesLedMat.emissiveIntensity = 0.65 + 0.35 * Math.sin(elapsed * 4.5);

      // Scroll Live Market Ticker Ribbon, Sway Plants, Pulse Floor Data Packets, & Spin Clock
      if (!reducedMotion && st.simSpeed > 0) {
        tickerTex.offset.x = (tickerTex.offset.x + dt * 0.055) % 1;
        clockHandPivot.rotation.z = -elapsed * 0.65;
        studioMotes.rotation.y = elapsed * 0.04;
        studioMotes.position.y = Math.sin(elapsed * 0.7) * 0.06;

        plantCanopies.forEach(({ canopy, phase }) => {
          canopy.rotation.z = Math.sin(elapsed * 1.45 + phase) * 0.045;
          canopy.rotation.x = Math.cos(elapsed * 1.1 + phase) * 0.03;
        });

        tableLaptops.forEach((mat, idx) => {
          mat.emissiveIntensity = 0.65 + 0.3 * Math.sin(elapsed * 3.5 + idx * 1.8);
        });
      }

      // Animate Executive AI Agents
      const isGathering =
        st.auditPhase === "debating" || st.auditPhase === "verdict";

      STATION_IDS.forEach((id) => {
        const ag = agents[id];
        const isSelected = st.selectedStation === id;
        ag.haloMat.opacity = isSelected
          ? 0.78 + Math.sin(elapsed * 4) * 0.18
          : 0.28;

        let microStatus = IDLE_MICRO_TASKS[id];

        if (!reducedMotion && st.simSpeed > 0) {
          if (ag.waveTimer > 0) {
            ag.waveTimer = Math.max(0, ag.waveTimer - rawDt);
            const waveProgress = 1 - ag.waveTimer / 1.8;
            ag.bodyGroup.position.y =
              Math.abs(Math.sin(waveProgress * Math.PI * 2)) * 0.2;
            ag.rightArm.rotation.x = -2.4 + Math.sin(elapsed * 18) * 0.35;
            ag.leftArm.rotation.x = -0.35;
            ag.head.rotation.z = Math.sin(elapsed * 12) * 0.12;
            microStatus = ACTION_MICRO_LABELS.wave;
          } else {
            if (ag.commandTimer > 0 && ag.commandTarget) {
              ag.commandTimer = Math.max(0, ag.commandTimer - dt);
              microStatus = ACTION_MICRO_LABELS[ag.commandAction] || microStatus;
              if (ag.commandTimer === 0) {
                ag.commandTarget = null;
                ag.commandLookAt = null;
                ag.commandAction = "idle";
              }
            } else if (isGathering) {
              microStatus = ACTION_MICRO_LABELS.meeting;
            }

            let target: THREE.Vector3;
            let lookTarget: THREE.Vector3 | null = null;
            let activeAction: ExecutiveAgentRig["commandAction"] = "idle";
            let moveSpeed = 1.08;
            const currentStop =
              ag.routineStops[ag.routineIdx] ?? ag.routineStops[0]!;

            if (ag.commandTarget) {
              target = ag.commandTarget;
              lookTarget = ag.commandLookAt;
              activeAction = ag.commandAction;
              moveSpeed = 1.65;
            } else if (isGathering) {
              target = ag.meetingPos;
              lookTarget = new THREE.Vector3(1.55, 0.7, 1.55);
              activeAction = "meeting";
              moveSpeed = 1.55;
            } else {
              target = currentStop.pos;
              lookTarget = currentStop.lookAt;
              activeAction = currentStop.action;
              moveSpeed = st.auditPhase === "scanning" ? 1.35 : 0.95;
            }

            const goalKey = `${target.x.toFixed(2)},${target.z.toFixed(2)}`;
            if (ag.pathGoalKey !== goalKey) {
              ag.pathGoalKey = goalKey;
              ag.arrived = false;
              ag.pathQueue = computeStudioPath(ag.pos, target);
            }

            if (!ag.arrived && ag.pos.distanceTo(target) <= 0.12) {
              ag.arrived = true;
              ag.pathQueue = [];
              ag.pos.copy(target);
              ag.root.position.copy(ag.pos);
            }

            if (!ag.arrived) {
              ag.bookMesh.visible = false;
              const nextWp = ag.pathQueue[0] ?? target;
              const distWp = ag.pos.distanceTo(nextWp);
              if (distWp <= 0.14 && ag.pathQueue.length > 1) {
                ag.pathQueue.shift();
              }

              const steerTarget = ag.pathQueue[0] ?? target;
              const distSteer = ag.pos.distanceTo(steerTarget);
              if (distSteer > 0.02) {
                const step = Math.min(distSteer, dt * moveSpeed);
                let dirX = (steerTarget.x - ag.pos.x) / distSteer;
                let dirZ = (steerTarget.z - ag.pos.z) / distSteer;

                // Soft personal-space avoidance only while walking far from final target
                if (ag.pos.distanceTo(target) > 0.45) {
                  STATION_IDS.forEach((otherId) => {
                    if (otherId === id) return;
                    const other = agents[otherId];
                    const ox = ag.pos.x - other.pos.x;
                    const oz = ag.pos.z - other.pos.z;
                    const oDist = Math.hypot(ox, oz);
                    if (oDist > 0.001 && oDist < 0.56) {
                      const push = (0.56 - oDist) * 1.1;
                      dirX += (ox / oDist) * push;
                      dirZ += (oz / oDist) * push;
                    }
                  });
                }

                const dirLen = Math.hypot(dirX, dirZ) || 1;
                dirX /= dirLen;
                dirZ /= dirLen;

                ag.pos.x += dirX * step;
                ag.pos.z += dirZ * step;
                resolveObstacleCollision(ag.pos, 0.2);
                ag.root.position.copy(ag.pos);

                const yaw = Math.atan2(dirX, dirZ);
                let dYaw = yaw - ag.root.rotation.y;
                while (dYaw > Math.PI) dYaw -= Math.PI * 2;
                while (dYaw < -Math.PI) dYaw += Math.PI * 2;
                ag.root.rotation.y += dYaw * Math.min(1, dt * 8);

                ag.walkPhase += dt * moveSpeed * 8.5;
                const s = Math.sin(ag.walkPhase);
                ag.leftLeg.rotation.x = s * 0.56;
                ag.rightLeg.rotation.x = -s * 0.56;
                ag.leftArm.rotation.x = -s * 0.42;
                ag.rightArm.rotation.x = s * 0.42;
                ag.bodyGroup.position.y = Math.abs(s) * 0.035;
                ag.head.rotation.x = 0;
                ag.head.rotation.z = Math.sin(ag.walkPhase * 0.5) * 0.035;
              }
            } else {
              // Arrived cleanly — stand/sit still & perform natural station posture!
              if (!ag.commandTarget && !isGathering) {
                microStatus = ACTION_MICRO_LABELS[activeAction] || IDLE_MICRO_TASKS[id];
              }

              if (lookTarget) {
                const lookYaw = Math.atan2(
                  lookTarget.x - ag.pos.x,
                  lookTarget.z - ag.pos.z
                );
                let dYaw = lookYaw - ag.root.rotation.y;
                while (dYaw > Math.PI) dYaw -= Math.PI * 2;
                while (dYaw < -Math.PI) dYaw += Math.PI * 2;
                ag.root.rotation.y += dYaw * Math.min(1, dt * 7);
              }

              if (activeAction === "sit_desk") {
                ag.bookMesh.visible = false;
                ag.bodyGroup.position.y += (-0.11 - ag.bodyGroup.position.y) * 0.18;
                ag.leftLeg.rotation.x += (-1.35 - ag.leftLeg.rotation.x) * 0.18;
                ag.rightLeg.rotation.x += (-1.35 - ag.rightLeg.rotation.x) * 0.18;
                ag.leftArm.rotation.x = -0.82 + Math.sin(elapsed * 11) * 0.08;
                ag.rightArm.rotation.x = -0.82 + Math.cos(elapsed * 11) * 0.08;
                ag.head.rotation.x = -0.06 + Math.sin(elapsed * 1.8) * 0.04;
                ag.head.rotation.z = Math.sin(elapsed * 1.1) * 0.05;
              } else if (activeAction === "meeting") {
                // Sit squarely on the conference chairs around the round table!
                ag.bookMesh.visible = false;
                ag.bodyGroup.position.y += (-0.12 - ag.bodyGroup.position.y) * 0.18;
                ag.leftLeg.rotation.x += (-1.35 - ag.leftLeg.rotation.x) * 0.18;
                ag.rightLeg.rotation.x += (-1.35 - ag.rightLeg.rotation.x) * 0.18;
                ag.leftArm.rotation.x = -0.68 + Math.sin(elapsed * 4.5 + ag.walkPhase) * 0.14;
                ag.rightArm.rotation.x = -0.68 + Math.cos(elapsed * 4 + ag.walkPhase) * 0.14;
                ag.head.rotation.x = Math.sin(elapsed * 2.8) * 0.07;
              } else if (activeAction === "read") {
                ag.bookMesh.visible = true;
                ag.bodyGroup.position.y += (Math.sin(elapsed * 2.2) * 0.01 - ag.bodyGroup.position.y) * 0.2;
                ag.leftLeg.rotation.x *= 0.82;
                ag.rightLeg.rotation.x *= 0.82;
                ag.rightArm.rotation.x = -0.95 + Math.sin(elapsed * 2) * 0.04;
                ag.leftArm.rotation.x = -0.45;
                ag.head.rotation.x = 0.22 + Math.sin(elapsed * 2.4) * 0.04;
              } else if (activeAction === "present") {
                ag.bookMesh.visible = false;
                ag.bodyGroup.position.y += (Math.sin(elapsed * 2.4) * 0.012 - ag.bodyGroup.position.y) * 0.2;
                ag.leftLeg.rotation.x *= 0.82;
                ag.rightLeg.rotation.x *= 0.82;
                ag.rightArm.rotation.x = -1.35 + Math.sin(elapsed * 6) * 0.25;
                ag.leftArm.rotation.x = -0.35 + Math.cos(elapsed * 4) * 0.12;
                ag.head.rotation.x = -0.16 + Math.sin(elapsed * 3) * 0.06;
              } else if (activeAction === "coffee") {
                ag.bookMesh.visible = false;
                ag.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 4.5)) * 0.04;
                ag.leftLeg.rotation.x *= 0.82;
                ag.rightLeg.rotation.x *= 0.82;
                ag.rightArm.rotation.x = -1.1 + Math.sin(elapsed * 5) * 0.22;
                ag.leftArm.rotation.x = -0.25;
                ag.head.rotation.x = -0.05;
              } else {
                ag.bookMesh.visible = false;
                ag.bodyGroup.position.y += (Math.sin(elapsed * 2.4) * 0.01 - ag.bodyGroup.position.y) * 0.2;
                ag.leftLeg.rotation.x *= 0.82;
                ag.rightLeg.rotation.x *= 0.82;
                ag.leftArm.rotation.x = -0.65 + Math.sin(elapsed * 14) * 0.1;
                ag.rightArm.rotation.x = -0.65 + Math.cos(elapsed * 14) * 0.1;
                ag.head.rotation.x = 0;
              }

              if (!ag.commandTarget && !isGathering) {
                ag.pauseTimer += dt;
                if (ag.pauseTimer >= currentStop.dwell) {
                  ag.pauseTimer = 0;
                  ag.routineIdx = (ag.routineIdx + 1) % ag.routineStops.length;
                }
              }
            }
          }
        }

        const statusNode = statusSpanRefs.current[id];
        if (statusNode && statusNode.textContent !== microStatus) {
          statusNode.textContent = microStatus;
        }
      });

      composer.render(rawDt);

      // Update Floating Nameplate + Collision-Free De-Overlapping Layout
      const pinPositions: { id: StationId; px: number; py: number }[] = [];
      STATION_IDS.forEach((id) => {
        const ag = agents[id];
        if (!ag) return;
        projectedVec.set(ag.pos.x, 1.48, ag.pos.z).project(camera);
        const rawPx = (projectedVec.x * 0.5 + 0.5) * viewW;
        const rawPy = (-projectedVec.y * 0.5 + 0.5) * viewH;
        pinPositions.push({
          id,
          px: Math.max(60, Math.min(viewW - 60, rawPx)),
          py: Math.max(54, Math.min(viewH - 16, rawPy)),
        });
      });

      // Simple 2-pass vertical & horizontal separation so badges never stack on top of each other
      pinPositions.sort((a, b) => a.py - b.py);
      for (let i = 0; i < pinPositions.length; i++) {
        for (let j = i + 1; j < pinPositions.length; j++) {
          const upper = pinPositions[i]!;
          const lower = pinPositions[j]!;
          const dx = Math.abs(upper.px - lower.px);
          const dy = Math.abs(lower.py - upper.py);
          if (dx < 104 && dy < 42) {
            const push = (42 - dy) * 0.65;
            upper.py = Math.max(54, upper.py - push);
            lower.py = Math.min(viewH - 12, lower.py + push * 0.5);
          }
        }
      }

      pinPositions.forEach(({ id, px, py }) => {
        const el = pinRefs.current[id];
        if (!el) return;
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = "1";
      });
    };

    const startLoop = () => {
      if (!disposed && !rafId && isInView && !document.hidden) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(animate);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        isInView = Boolean(entries[0]?.isIntersecting);
        if (isInView) {
          startLoop();
        } else if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { rootMargin: "140px" }
    );
    io.observe(container);

    const onVisibility = () => {
      if (!document.hidden && isInView) startLoop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    startLoop();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);

      envRT.dispose();
      pmremGenerator.dispose();
      composer.dispose();
      effectPass.dispose();
      renderPass.dispose();
      bloomEffect.dispose();

      tickerTex.dispose();
      skylineTex.dispose();
      boardTex.dispose();
      statusTex.dispose();
      quantTex.dispose();
      riskTex.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  if (webglError) {
    return (
      <div className="flex h-[310px] w-full items-center justify-center rounded-sm border border-hairline bg-canvas p-6 text-center sm:h-[430px] lg:h-[520px]">
        <p className="max-w-md font-sans text-xs leading-relaxed text-text-secondary">
          {fallbackText}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Simulasi ruang sidang 3D komite audit TesisLab"
      className="relative h-[310px] w-full overflow-hidden bg-canvas sm:h-[430px] lg:h-[520px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full touch-pan-y" />

      {/* Luminous 5-Angle Camera Director + Zoom Controls (Single-Row Scrollable on Mobile) */}
      <div className="no-scrollbar absolute left-2.5 top-2.5 z-20 flex max-w-[calc(100%-20px)] items-center gap-1 overflow-x-auto rounded-lg border border-hairline bg-obsidian/90 p-1 backdrop-blur-md">
        {(
          [
            { id: "panorama", label: "PANORAMA" },
            { id: "meeting", label: "SIDANG" },
            { id: "desks", label: "MEJA KERJA" },
            { id: "top", label: "DENAH" },
            { id: "follow", label: "IKUTI AGEN" },
          ] as const
        ).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectCameraPreset(preset.id)}
            aria-pressed={cameraPreset === preset.id}
            className={cn(
              "min-h-[34px] shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
              cameraPreset === preset.id
                ? "bg-cleared/18 text-cleared"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {preset.label}
          </button>
        ))}

        <span className="mx-0.5 h-4 w-px shrink-0 bg-hairline" aria-hidden="true" />

        <button
          type="button"
          onClick={() => handleZoomStep(1)}
          title="Zoom In"
          aria-label="Zoom In"
          className="inline-flex min-h-[34px] min-w-[34px] shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-cleared"
        >
          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleZoomStep(-1)}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="inline-flex min-h-[34px] min-w-[34px] shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-cleared"
        >
          <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Floating Executive Agent Nameplates + Live Activity Speech Bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STATION_IDS.map((id) => {
          const isSelected = selectedStation === id;
          const dotColor =
            id === "hermes"
              ? "bg-sky-400"
              : id === "data_analyst"
                ? "bg-cleared"
                : id === "risk_manager"
                  ? "bg-rejected"
                  : "bg-conditional";

          return (
            <button
              key={id}
              ref={(node) => {
                pinRefs.current[id] = node;
              }}
              type="button"
              onClick={() => onSelectStation(id)}
              style={{ opacity: 0 }}
              className={cn(
                "pointer-events-auto absolute left-0 top-0 flex flex-col items-center rounded-lg border px-2.5 py-1 shadow-lg backdrop-blur-md transition-colors",
                isSelected
                  ? "border-cleared/80 bg-obsidian/95 text-text-primary shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)]"
                  : "border-hairline bg-obsidian/88 text-text-secondary hover:border-active-border hover:text-text-primary"
              )}
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider">
                <span
                  aria-hidden="true"
                  className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)}
                />
                <span>{stationLabels[id]}</span>
              </span>
              <span
                ref={(node) => {
                  statusSpanRefs.current[id] = node;
                }}
                className="hidden max-w-[130px] truncate font-sans text-[10px] font-medium text-cleared sm:block"
              >
                {IDLE_MICRO_TASKS[id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
