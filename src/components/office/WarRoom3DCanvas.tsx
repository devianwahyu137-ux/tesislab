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
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { AgentRole, AuditPhase } from "@/context/AuditUIContext";
import type { Theme } from "@/context/ThemeContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { VerdictStatus } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

export type StationId = "hermes" | AgentRole;

export interface WarRoom3DCanvasProps {
  theme: Theme;
  auditPhase: AuditPhase;
  activeAgent: AgentRole | null;
  verdictStatus?: VerdictStatus;
  macroOrigin: MacroFeedOrigin;
  selectedStation: StationId;
  onSelectStation: (station: StationId) => void;
  stationLabels: Record<StationId, string>;
  fallbackText: string;
}

interface DynamicStateRef {
  theme: Theme;
  auditPhase: AuditPhase;
  activeAgent: AgentRole | null;
  verdictStatus?: VerdictStatus;
  macroOrigin: MacroFeedOrigin;
  selectedStation: StationId;
  hoveredStation: StationId | null;
}

const STATION_IDS: readonly StationId[] = [
  "hermes",
  "data_analyst",
  "risk_manager",
  "committee_chair",
];

const OFFICE_PALETTES = {
  dark: {
    canvasBg: 0x0d1117,
    floor: 0x262e3a,
    wall: 0x1c232e,
    wallTrim: 0x334155,
    wood: 0xc28550,
    woodDark: 0x8f5d32,
    chairMat: 0x334155,
    shelfMat: 0xd1d5db,
    rugRound: 0x384354,
    hemiSky: 0xf8fafc,
    hemiGround: 0x334155,
    hemiIntensity: 1.35,
    sunIntensity: 1.55,
    fillIntensity: 0.65,
    bloomIntensity: 0.14,
  },
  light: {
    canvasBg: 0xe9edf2,
    floor: 0xe6e4de,
    wall: 0xf4f3ef,
    wallTrim: 0xcbd5e1,
    wood: 0xc98d55,
    woodDark: 0x996538,
    chairMat: 0x475569,
    shelfMat: 0xffffff,
    rugRound: 0xc8ccd0,
    hemiSky: 0xffffff,
    hemiGround: 0xcbd5e1,
    hemiIntensity: 1.55,
    sunIntensity: 1.45,
    fillIntensity: 0.55,
    bloomIntensity: 0.08,
  },
} as const;

const AGENT_COLORS: Record<StationId, number> = {
  hermes: 0x38bdf8, // Sky Blue
  data_analyst: 0x10b981, // Vivid Emerald
  risk_manager: 0xef4444, // Vivid Coral Red
  committee_chair: 0xf59e0b, // Warm Amber Gold
};

function tagStation(group: THREE.Object3D, stationId: StationId) {
  group.userData.stationId = stationId;
  group.traverse((child) => {
    child.userData.stationId = stationId;
  });
}

/**
 * Procedural CanvasTexture for office workstation monitors & large wall status display.
 */
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
    ctx.fillStyle = kind === "board" ? "#F8FAFC" : "#0F172A";
    ctx.fillRect(0, 0, 512, 320);

    // Header strip
    ctx.fillStyle = accent;
    ctx.fillRect(24, 22, 110, 10);

    ctx.fillStyle = kind === "board" ? "#0F172A" : "#F1F5F9";
    ctx.font = "bold 22px monospace";
    ctx.fillText(title, 24, 68);

    if (kind === "board") {
      // Sticky notes grid on whiteboard
      const colors = ["#FDE047", "#6EE7B7", "#FCA5A5", "#93C5FD"];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = colors[(row * 4 + col) % colors.length];
          ctx.fillRect(28 + col * 114, 96 + row * 94, 92, 72);
          ctx.fillStyle = "rgba(15,23,42,0.28)";
          ctx.fillRect(38 + col * 114, 114 + row * 94, 62, 6);
          ctx.fillRect(38 + col * 114, 130 + row * 94, 44, 6);
        }
      }
    } else if (kind === "status") {
      // Wall projection dashboard with live curve & KPI
      ctx.fillStyle = "#94A3B8";
      ctx.font = "16px monospace";
      ctx.fillText("LIVE AUDIT ENGINE · 1,000 MONTE CARLO", 24, 98);

      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(28, 255);
      ctx.lineTo(105, 220);
      ctx.lineTo(185, 238);
      ctx.lineTo(270, 165);
      ctx.lineTo(355, 185);
      ctx.lineTo(445, 128);
      ctx.lineTo(486, 142);
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.16;
      ctx.lineTo(486, 280);
      ctx.lineTo(28, 280);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Candlestick bars on desk monitors
      const bars = [64, 110, 82, 145, 122, 168, 96, 134];
      bars.forEach((h, i) => {
        ctx.fillStyle = i % 3 === 0 ? "#EF4444" : accent;
        ctx.fillRect(30 + i * 56, 275 - h, 32, h);
      });
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface StylizedAgentRig {
  id: StationId;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  pos: THREE.Vector3;
  homePos: THREE.Vector3;
  meetingPos: THREE.Vector3;
  patrolPoints: THREE.Vector3[];
  patrolIdx: number;
  pauseTimer: number;
  walkPhase: number;
}

/**
 * Stylized bright glossy 3D AI Agent (inspired by modern Three.js AI agent office demos)
 * with round expressive head, eyes, articulated limbs, and glowing data tablet.
 */
function createStylizedAgent(
  id: StationId,
  colorHex: number,
  homePos: THREE.Vector3,
  meetingPos: THREE.Vector3,
  patrolPoints: THREE.Vector3[]
): StylizedAgentRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const mainMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.28,
    metalness: 0.08,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
  });
  const tabletMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: colorHex,
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });

  // Legs (hip pivot y = 0.28)
  const makeLeg = (xOff: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOff, 0.28, 0);
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.14, 6, 10),
      mainMat
    );
    leg.position.y = -0.14;
    leg.castShadow = true;
    pivot.add(leg);
    bodyGroup.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-0.085);
  const rightLeg = makeLeg(0.085);

  // Rounded Torso
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.17, 0.2, 8, 14),
    mainMat
  );
  torso.position.y = 0.48;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Arms (shoulder pivot y = 0.56)
  const makeArm = (xOff: number, holdsTablet: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOff, 0.56, 0);
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.16, 6, 10),
      mainMat
    );
    arm.position.y = -0.12;
    arm.castShadow = true;
    pivot.add(arm);
    if (holdsTablet) {
      const tablet = new THREE.Mesh(
        new RoundedBoxGeometry(0.18, 0.024, 0.24, 2, 0.008),
        tabletMat
      );
      tablet.position.set(0.02, -0.22, 0.11);
      tablet.rotation.x = 0.35;
      pivot.add(tablet);
    }
    bodyGroup.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-0.21, false);
  const rightArm = makeArm(0.21, id === "hermes" || id === "committee_chair");

  // Expressive Round Head + Eyes + Little Crest Sprout
  const head = new THREE.Group();
  head.position.y = 0.86;
  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 18),
    mainMat
  );
  cranium.castShadow = true;
  head.add(cranium);

  // Small stylized sprout/crest on top
  const crest = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.1, 8),
    mainMat
  );
  crest.position.y = 0.23;
  head.add(crest);

  // Big friendly-sharp studio eyes
  for (const ex of [-0.075, 0.075]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      eyeWhiteMat
    );
    eye.position.set(ex, 0.02, 0.185);
    eye.scale.set(1, 1.12, 0.7);
    head.add(eye);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 10),
      pupilMat
    );
    pupil.position.set(ex, 0.02, 0.22);
    head.add(pupil);
  }
  bodyGroup.add(head);

  root.position.copy(homePos);
  tagStation(root, id);

  return {
    id,
    root,
    bodyGroup,
    head,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    pos: homePos.clone(),
    homePos: homePos.clone(),
    meetingPos: meetingPos.clone(),
    patrolPoints,
    patrolIdx: 0,
    pauseTimer: 0,
    walkPhase: Math.random() * Math.PI * 2,
  };
}

/**
 * Helper to create a warm wooden office desk + monitor + keyboard + chair + rug.
 */
function createOfficeWorkstation(opts: {
  woodMat: THREE.MeshStandardMaterial;
  woodDarkMat: THREE.MeshStandardMaterial;
  chairMat: THREE.MeshStandardMaterial;
  screenTex: THREE.CanvasTexture;
  rugColor: number;
  stationId: StationId;
}): THREE.Group {
  const g = new THREE.Group();

  // Colored Zone Rug
  const rug = new THREE.Mesh(
    new RoundedBoxGeometry(2.15, 0.02, 1.65, 2, 0.01),
    new THREE.MeshStandardMaterial({
      color: opts.rugColor,
      roughness: 0.92,
      transparent: true,
      opacity: 0.78,
    })
  );
  rug.position.y = 0.01;
  rug.receiveShadow = true;
  g.add(rug);

  // Wooden Desk Top
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(1.52, 0.08, 0.84, 2, 0.02),
    opts.woodMat
  );
  top.position.y = 0.58;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // 4 Desk Legs
  for (const [lx, lz] of [
    [-0.66, -0.34],
    [0.66, -0.34],
    [-0.66, 0.34],
    [0.66, 0.34],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.56, 0.06),
      opts.woodDarkMat
    );
    leg.position.set(lx, 0.28, lz);
    leg.castShadow = true;
    g.add(leg);
  }

  // Silver/Dark Monitor + Screen
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.76, 0.44, 0.04, 2, 0.01),
    opts.chairMat
  );
  bezel.position.set(0, 0.9, -0.18);
  bezel.castShadow = true;
  g.add(bezel);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.14, 0.08),
    opts.chairMat
  );
  stand.position.set(0, 0.66, -0.18);
  g.add(stand);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.38),
    new THREE.MeshBasicMaterial({ map: opts.screenTex })
  );
  screen.position.set(0, 0.9, -0.155);
  g.add(screen);

  // Keyboard
  const kb = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.02, 0.15, 2, 0.005),
    opts.chairMat
  );
  kb.position.set(0, 0.63, 0.12);
  g.add(kb);

  // Office Chair behind desk
  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.06, 0.44, 2, 0.015),
    opts.chairMat
  );
  seat.position.set(0, 0.36, 0.56);
  seat.castShadow = true;
  g.add(seat);

  const back = new THREE.Mesh(
    new RoundedBoxGeometry(0.44, 0.42, 0.06, 2, 0.015),
    opts.chairMat
  );
  back.position.set(0, 0.58, 0.76);
  back.castShadow = true;
  g.add(back);

  const chairStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8),
    opts.chairMat
  );
  chairStem.position.set(0, 0.18, 0.56);
  g.add(chairStem);

  tagStation(g, opts.stationId);
  return g;
}

/**
 * Helper to create a potted studio office plant.
 */
function createPottedPlant(): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 })
  );
  pot.position.y = 0.14;
  pot.castShadow = true;
  g.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.7,
  });
  const offsets: [number, number, number, number][] = [
    [0, 0.42, 0, 0.2],
    [-0.1, 0.36, 0.08, 0.14],
    [0.11, 0.38, -0.06, 0.15],
    [0.02, 0.54, 0.02, 0.13],
  ];
  offsets.forEach(([x, y, z, r]) => {
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    foliage.position.set(x, y, z);
    foliage.castShadow = true;
    g.add(foliage);
  });
  return g;
}

/**
 * Studio-Grade 3D AI Agents Office built on Pure Three.js + OrbitControls + Postprocessing.
 * Features warm wooden desks, round committee meeting table, whiteboard, wall status screen,
 * potted plants, sunlit window, and 4 bright stylized AI Agents that walk & gather for hearings.
 */
export default function WarRoom3DCanvas({
  theme,
  auditPhase,
  activeAgent,
  verdictStatus,
  macroOrigin,
  selectedStation,
  onSelectStation,
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
  const [webglError, setWebglError] = useState(false);
  const [cameraView, setCameraView] = useState<"iso" | "top">("iso");
  const cameraGoalRef = useRef<THREE.Vector3 | null>(null);

  const handleCameraPreset = (preset: "iso" | "top" | "reset") => {
    const isTop = preset === "top";
    setCameraView(isTop ? "top" : "iso");
    cameraGoalRef.current = isTop
      ? new THREE.Vector3(0.05, 10.2, 1.2)
      : new THREE.Vector3(6.2, 5.4, 7.2);
  };

  const onSelectRef = useRef(onSelectStation);
  useEffect(() => {
    onSelectRef.current = onSelectStation;
  }, [onSelectStation]);

  const stateRef = useRef<DynamicStateRef>({
    theme,
    auditPhase,
    activeAgent,
    verdictStatus,
    macroOrigin,
    selectedStation,
    hoveredStation: null,
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
    stateRef.current.macroOrigin = macroOrigin;
    stateRef.current.selectedStation = selectedStation;

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
    macroOrigin,
    selectedStation,
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const initialPal = OFFICE_PALETTES[stateRef.current.theme];
    scene.background = new THREE.Color(initialPal.canvasBg);

    const camera = new THREE.PerspectiveCamera(29, 16 / 9, 0.1, 100);
    camera.position.set(6.2, 5.4, 7.2);

    // Subtle Studio Postprocessing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomEffect = new BloomEffect({
      intensity: initialPal.bloomIntensity,
      luminanceThreshold: 0.9,
      mipmapBlur: true,
    });
    const effectPass = new EffectPass(camera, bloomEffect);
    composer.addPass(renderPass);
    composer.addPass(effectPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.target.set(0, 0.55, 0);
    controls.update();

    // Bright Daylight-Studio Lighting
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
    sunLight.position.set(-6, 11, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 28;
    sunLight.shadow.camera.left = -6.5;
    sunLight.shadow.camera.right = 6.5;
    sunLight.shadow.camera.top = 6.5;
    sunLight.shadow.camera.bottom = -6.5;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(
      0xdbeafe,
      initialPal.fillIntensity
    );
    fillLight.position.set(7, 6, -4);
    scene.add(fillLight);

    // Shared Office Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: initialPal.floor,
      roughness: 0.85,
      metalness: 0.04,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: initialPal.wall,
      roughness: 0.88,
      metalness: 0.02,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: initialPal.wallTrim,
      roughness: 0.7,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: initialPal.wood,
      roughness: 0.62,
      metalness: 0.04,
    });
    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: initialPal.woodDark,
      roughness: 0.72,
    });
    const chairMat = new THREE.MeshStandardMaterial({
      color: initialPal.chairMat,
      roughness: 0.55,
      metalness: 0.15,
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      color: initialPal.shelfMat,
      roughness: 0.7,
    });
    const rugRoundMat = new THREE.MeshStandardMaterial({
      color: initialPal.rugRound,
      roughness: 0.94,
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

    // === 1. Office Floor & Architectural L-Walls with Window ===
    const floor = new THREE.Mesh(
      new RoundedBoxGeometry(8.6, 0.22, 7.2, 2, 0.03),
      floorMat
    );
    floor.position.y = -0.11;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back Wall (z = -3.5)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 2.3, 0.2),
      wallMat
    );
    backWall.position.set(0, 1.15, -3.5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall with Window Opening feel (x = -4.2)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.3, 7.2),
      wallMat
    );
    leftWall.position.set(-4.2, 1.15, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Daylight Window Frame on Left Wall
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.4),
      new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.45,
      })
    );
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-4.09, 1.28, 0.6);
    scene.add(windowGlass);

    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.46, 2.66),
      trimMat
    );
    windowFrame.position.set(-4.11, 1.28, 0.6);
    scene.add(windowFrame);

    // Baseboard trims
    const baseBack = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, 0.12, 0.04),
      trimMat
    );
    baseBack.position.set(0, 0.06, -3.38);
    scene.add(baseBack);

    // === 2. Procedural Screens (Whiteboard, Wall Status Display, Monitors) ===
    const boardTex = createScreenTexture("PRE-MORTEM BOARD", "#10B981", "board");
    const statusTex = createScreenTexture("AUDIT STATUS", "#38BDF8", "status");
    const quantTex = createScreenTexture("QUANT ENGINE", "#10B981", "chart");
    const riskTex = createScreenTexture("RISK MATRIX", "#EF4444", "chart");

    // Whiteboard on Back Wall
    const whiteboardFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.2, 1.25, 0.06, 2, 0.015),
      trimMat
    );
    whiteboardFrame.position.set(-0.2, 1.32, -3.36);
    scene.add(whiteboardFrame);

    const whiteboardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.08, 1.14),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    whiteboardFace.position.set(-0.2, 1.32, -3.32);
    scene.add(whiteboardFace);

    // Large Wall Status Display on Back-Right Wall
    const wallScreenFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.15, 1.32, 0.07, 2, 0.02),
      chairMat
    );
    wallScreenFrame.position.set(2.55, 1.32, -3.36);
    scene.add(wallScreenFrame);

    const wallScreenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.02, 1.18),
      new THREE.MeshBasicMaterial({ map: statusTex })
    );
    wallScreenFace.position.set(2.55, 1.32, -3.315);
    scene.add(wallScreenFace);

    // === 3. Office Furniture: Hermes Server Rack, Bookshelf, Plants, 2 Desks, Round Table ===
    // HERMES Server Rack (Back-Left Corner)
    const hermesRack = new THREE.Group();
    hermesRack.position.set(-3.15, 0, -2.55);
    const rackBody = new THREE.Mesh(
      new RoundedBoxGeometry(0.92, 1.42, 0.72, 2, 0.03),
      chairMat
    );
    rackBody.position.y = 0.71;
    rackBody.castShadow = true;
    rackBody.receiveShadow = true;
    hermesRack.add(rackBody);

    const hermesLedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
    });
    for (let i = 0; i < 4; i++) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.045, 0.03),
        hermesLedMat
      );
      strip.position.set(0, 0.32 + i * 0.28, 0.37);
      hermesRack.add(strip);
    }
    tagStation(hermesRack, "hermes");
    scene.add(hermesRack);

    // Bookshelf next to whiteboard
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(0.95, 1.05, 0.36, 2, 0.02),
      shelfMat
    );
    shelf.position.set(-1.95, 0.525, -3.15);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);

    // Books inside shelf
    const bookColors = [0x10b981, 0x38bdf8, 0xf59e0b, 0xef4444, 0x6366f1];
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.28, 0.24),
        new THREE.MeshStandardMaterial({
          color: bookColors[i],
          roughness: 0.65,
        })
      );
      book.position.set(-2.22 + i * 0.14, 0.78, -3.12);
      scene.add(book);
    }

    // 3 Potted Plants around the office
    const plantCoords: [number, number][] = [
      [-3.65, -1.2],
      [3.7, -2.9],
      [-3.55, 2.7],
    ];
    plantCoords.forEach(([px, pz]) => {
      const plant = createPottedPlant();
      plant.position.set(px, 0, pz);
      scene.add(plant);
    });

    // Workstation 1: QUANT (Front-Left)
    const quantDesk = createOfficeWorkstation({
      woodMat,
      woodDarkMat,
      chairMat,
      screenTex: quantTex,
      rugColor: 0x10b981,
      stationId: "data_analyst",
    });
    quantDesk.position.set(-2.05, 0, 1.45);
    quantDesk.rotation.y = 0.18;
    scene.add(quantDesk);

    // Workstation 2: RISK (Back-Right)
    const riskDesk = createOfficeWorkstation({
      woodMat,
      woodDarkMat,
      chairMat,
      screenTex: riskTex,
      rugColor: 0xef4444,
      stationId: "risk_manager",
    });
    riskDesk.position.set(2.25, 0, -1.25);
    riskDesk.rotation.y = -0.25;
    scene.add(riskDesk);

    // Round Committee Meeting Table (Front-Right Center)
    const meetingGroup = new THREE.Group();
    meetingGroup.position.set(1.65, 0, 1.65);

    const roundRug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 0.02, 32),
      rugRoundMat
    );
    roundRug.position.y = 0.01;
    roundRug.receiveShadow = true;
    meetingGroup.add(roundRug);

    const roundTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.07, 28),
      woodMat
    );
    roundTop.position.y = 0.56;
    roundTop.castShadow = true;
    roundTop.receiveShadow = true;
    meetingGroup.add(roundTop);

    const roundLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.24, 0.54, 16),
      woodDarkMat
    );
    roundLeg.position.y = 0.27;
    roundLeg.castShadow = true;
    meetingGroup.add(roundLeg);

    // 3 Meeting Chairs around the Round Table
    [0.5, 2.6, 4.7].forEach((angle) => {
      const cx = Math.cos(angle) * 1.05;
      const cz = Math.sin(angle) * 1.05;
      const chair = new THREE.Mesh(
        new RoundedBoxGeometry(0.36, 0.36, 0.36, 2, 0.04),
        chairMat
      );
      chair.position.set(cx, 0.22, cz);
      chair.rotation.y = -angle;
      chair.castShadow = true;
      meetingGroup.add(chair);
    });

    // Verdict Status Ring on Meeting Table
    const verdictRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
    });
    const tableRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.025, 10, 32),
      verdictRingMat
    );
    tableRing.rotation.x = Math.PI / 2;
    tableRing.position.y = 0.61;
    meetingGroup.add(tableRing);

    tagStation(meetingGroup, "committee_chair");
    scene.add(meetingGroup);

    // === 4. Four Stylized Walking & Working 3D AI Agents ===
    const agents: Record<StationId, StylizedAgentRig> = {
      hermes: createStylizedAgent(
        "hermes",
        AGENT_COLORS.hermes,
        new THREE.Vector3(-2.3, 0, -1.65),
        new THREE.Vector3(0.55, 0, 0.95),
        [
          new THREE.Vector3(-2.3, 0, -1.65),
          new THREE.Vector3(-0.4, 0, -2.1),
          new THREE.Vector3(0.4, 0, 0.2),
          new THREE.Vector3(-1.1, 0, 0.1),
        ]
      ),
      data_analyst: createStylizedAgent(
        "data_analyst",
        AGENT_COLORS.data_analyst,
        new THREE.Vector3(-1.95, 0, 2.02),
        new THREE.Vector3(0.72, 0, 1.95),
        [
          new THREE.Vector3(-1.95, 0, 2.02),
          new THREE.Vector3(-0.6, 0, 1.45),
          new THREE.Vector3(-0.35, 0, -2.25),
        ]
      ),
      risk_manager: createStylizedAgent(
        "risk_manager",
        AGENT_COLORS.risk_manager,
        new THREE.Vector3(2.45, 0, -0.68),
        new THREE.Vector3(2.55, 0, 1.15),
        [
          new THREE.Vector3(2.45, 0, -0.68),
          new THREE.Vector3(1.1, 0, -2.25),
          new THREE.Vector3(0.8, 0, -0.2),
        ]
      ),
      committee_chair: createStylizedAgent(
        "committee_chair",
        AGENT_COLORS.committee_chair,
        new THREE.Vector3(2.35, 0, 2.25),
        new THREE.Vector3(1.75, 0, 2.65),
        [
          new THREE.Vector3(2.35, 0, 2.25),
          new THREE.Vector3(2.45, 0, -2.15),
          new THREE.Vector3(1.15, 0, 0.55),
        ]
      ),
    };

    Object.values(agents).forEach((ag) => scene.add(ag.root));

    const interactiveRoots = [
      hermesRack,
      quantDesk,
      riskDesk,
      meetingGroup,
      ...Object.values(agents).map((a) => a.root),
    ];

    const focusTargets: Record<StationId, THREE.Vector3> = {
      hermes: new THREE.Vector3(-0.9, 0.6, -0.7),
      data_analyst: new THREE.Vector3(-0.8, 0.55, 0.6),
      risk_manager: new THREE.Vector3(0.8, 0.55, -0.5),
      committee_chair: new THREE.Vector3(0.7, 0.55, 0.7),
    };
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
      const dist = aspect < 1.25 ? 8.4 : 6.7;
      const currentLen = camera.position.length();
      if (currentLen > 0) {
        const targetLen = Math.sqrt(dist * dist * 2 + (dist * 0.82) ** 2);
        camera.position.setLength(targetLen);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Pointer Raycasting
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    let pointerDownPos = { x: 0, y: 0 };

    const getStationUnderPointer = (e: PointerEvent): StationId | null => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactiveRoots, true);
      for (const hit of hits) {
        const sid = hit.object.userData.stationId as StationId | undefined;
        if (sid) return sid;
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = getStationUnderPointer(e);
      stateRef.current.hoveredStation = hit;
      canvas.style.cursor = hit ? "pointer" : "grab";
    };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      cameraGoalRef.current = null;
    };
    const onPointerUp = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx < 6 && dy < 6) {
        const hit = getStationUnderPointer(e);
        if (hit) onSelectRef.current(hit);
      }
    };
    const onPointerLeave = () => {
      stateRef.current.hoveredStation = null;
      canvas.style.cursor = "default";
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let disposed = false;
    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const animate = (now: number) => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
      const elapsed = Math.max(0, (now - startTime) / 1000);

      const st = stateRef.current;

      // Camera Preset Lerp
      if (cameraGoalRef.current) {
        camera.position.lerp(cameraGoalRef.current, reducedMotion ? 1 : 0.085);
        if (camera.position.distanceTo(cameraGoalRef.current) < 0.05) {
          camera.position.copy(cameraGoalRef.current);
          cameraGoalRef.current = null;
        }
      }

      const desiredTarget = focusTargets[st.selectedStation];
      controls.target.lerp(desiredTarget, reducedMotion ? 1 : 0.055);
      controls.update();

      // Update Meeting Table Verdict Ring Color
      const ringColor =
        st.auditPhase === "verdict"
          ? st.verdictStatus === "REJECTED"
            ? 0xef4444
            : st.verdictStatus === "CONDITIONAL"
              ? 0xf59e0b
              : 0x10b981
          : 0x38bdf8;
      verdictRingMat.color.setHex(ringColor);
      verdictRingMat.emissive.setHex(ringColor);

      const hermesColor =
        st.macroOrigin === "remote_data_feed" ? 0x10b981 : 0xf59e0b;
      hermesLedMat.color.setHex(hermesColor);
      hermesLedMat.emissive.setHex(hermesColor);

      // Animate all 4 Stylized AI Agents (walk to meeting table during hearing, patrol & work when idle)
      const isGathering =
        st.auditPhase === "debating" || st.auditPhase === "verdict";

      STATION_IDS.forEach((id) => {
        const ag = agents[id];
        if (reducedMotion) return;

        let target: THREE.Vector3;
        let moveSpeed = 1.05;

        if (isGathering) {
          target = ag.meetingPos;
          moveSpeed = 1.65;
        } else if (id === "hermes" || id === "committee_chair") {
          // Hermes & Chair actively patrol the office floor between stations & whiteboard
          target = ag.patrolPoints[ag.patrolIdx] ?? ag.homePos;
          moveSpeed = st.auditPhase === "scanning" ? 1.5 : 0.92;
        } else {
          // Quant & Risk periodically walk to whiteboard, otherwise work actively at their wooden desks
          target = ag.patrolPoints[ag.patrolIdx] ?? ag.homePos;
          moveSpeed = 0.85;
        }

        const distToTarget = ag.pos.distanceTo(target);
        if (distToTarget > 0.08) {
          const step = Math.min(distToTarget, dt * moveSpeed);
          const dirX = (target.x - ag.pos.x) / distToTarget;
          const dirZ = (target.z - ag.pos.z) / distToTarget;
          ag.pos.x += dirX * step;
          ag.pos.z += dirZ * step;
          ag.root.position.copy(ag.pos);

          // Turn smoothly toward walking direction
          const yaw = Math.atan2(dirX, dirZ);
          let dYaw = yaw - ag.root.rotation.y;
          while (dYaw > Math.PI) dYaw -= Math.PI * 2;
          while (dYaw < -Math.PI) dYaw += Math.PI * 2;
          ag.root.rotation.y += dYaw * Math.min(1, dt * 8);

          // Natural bouncy stylized walk cycle
          ag.walkPhase += dt * moveSpeed * 8.5;
          const s = Math.sin(ag.walkPhase);
          ag.leftLeg.rotation.x = s * 0.62;
          ag.rightLeg.rotation.x = -s * 0.62;
          ag.leftArm.rotation.x = -s * 0.48;
          ag.rightArm.rotation.x =
            id === "hermes" || id === "committee_chair"
              ? -0.45 + s * 0.14
              : s * 0.48;
          ag.bodyGroup.position.y = Math.abs(s) * 0.045;
          ag.head.rotation.z = Math.sin(ag.walkPhase * 0.5) * 0.05;
        } else {
          // Arrived at station / meeting table: settle limbs & animate working/discussing
          ag.leftLeg.rotation.x *= 0.82;
          ag.rightLeg.rotation.x *= 0.82;
          ag.bodyGroup.position.y = Math.sin(elapsed * 2.4 + ag.walkPhase) * 0.014;

          if (isGathering) {
            // Face the center of the Round Committee Meeting Table
            const lookYaw = Math.atan2(1.65 - ag.pos.x, 1.65 - ag.pos.z);
            let dYaw = lookYaw - ag.root.rotation.y;
            while (dYaw > Math.PI) dYaw -= Math.PI * 2;
            while (dYaw < -Math.PI) dYaw += Math.PI * 2;
            ag.root.rotation.y += dYaw * Math.min(1, dt * 6);
            ag.leftArm.rotation.x = -0.35 + Math.sin(elapsed * 5 + ag.walkPhase) * 0.18;
            ag.rightArm.rotation.x = -0.35 + Math.cos(elapsed * 4.5 + ag.walkPhase) * 0.18;
            ag.head.rotation.x = Math.sin(elapsed * 3.5) * 0.08;
          } else {
            // Dwell pause at desk/whiteboard, then walk to next waypoint
            ag.leftArm.rotation.x = -0.5 + Math.sin(elapsed * 7) * 0.08;
            ag.rightArm.rotation.x = -0.5 + Math.cos(elapsed * 7) * 0.08;
            ag.pauseTimer += dt;
            const dwellDuration =
              id === "data_analyst" || id === "risk_manager" ? 4.8 : 2.6;
            if (ag.pauseTimer >= dwellDuration) {
              ag.pauseTimer = 0;
              ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrolPoints.length;
            }
          }
        }
      });

      composer.render(dt);

      // Update Dynamic Floating Nameplates above each walking agent's head
      STATION_IDS.forEach((id) => {
        const el = pinRefs.current[id];
        const ag = agents[id];
        if (!el || !ag) return;
        projectedVec.set(ag.pos.x, 1.32, ag.pos.z).project(camera);
        const rawPx = (projectedVec.x * 0.5 + 0.5) * viewW;
        const rawPy = (-projectedVec.y * 0.5 + 0.5) * viewH;
        const px = Math.max(46, Math.min(viewW - 46, rawPx));
        const py = Math.max(28, Math.min(viewH - 12, rawPy));
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = "1";
      });
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);

      composer.dispose();
      effectPass.dispose();
      renderPass.dispose();
      bloomEffect.dispose();

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
      <div className="flex h-[300px] w-full items-center justify-center rounded-sm border border-hairline bg-canvas p-6 text-center sm:h-[360px] lg:h-[420px]">
        <p className="max-w-md font-mono text-xs leading-relaxed text-ink-secondary">
          {fallbackText}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[300px] w-full overflow-hidden bg-canvas sm:h-[360px] lg:h-[420px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Camera View Preset Switcher (ISO / TOP / RESET) */}
      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-0.5 rounded-xs border border-hairline bg-surface/90 p-0.5 backdrop-blur-xs">
        {(
          [
            { id: "iso", label: "ISO" },
            { id: "top", label: "TOP" },
          ] as const
        ).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleCameraPreset(preset.id)}
            aria-pressed={cameraView === preset.id}
            className={cn(
              "rounded-xs px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
              cameraView === preset.id
                ? "bg-elevated text-cleared"
                : "text-ink-muted hover:text-ink-primary"
            )}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleCameraPreset("reset")}
          className="rounded-xs px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted transition-colors hover:text-ink-primary"
        >
          RESET
        </button>
      </div>

      {/* Dynamic Agent Nameplates Following Each Walking 3D AI Agent */}
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
                "pointer-events-auto absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-md backdrop-blur-xs transition-colors",
                isSelected
                  ? "border-cleared/80 bg-obsidian text-ink-primary"
                  : "border-hairline bg-obsidian/90 text-ink-secondary hover:border-active-border hover:text-ink-primary"
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)}
              />
              <span>{stationLabels[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
