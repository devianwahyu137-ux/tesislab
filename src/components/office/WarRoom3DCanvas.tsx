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

const THEME_PALETTES = {
  dark: {
    canvasBg: 0x0b0d10,
    bloomIntensity: 0.28,
    floorBase: 0x0e131a,
    floorTop: 0x161f2b,
    floorEdge: 0x3b495e,
    gridMain: 0x2a384b,
    gridSub: 0x1b2533,
    desk: 0x263345,
    deskDark: 0x1a2433,
    edge: 0x4b5c74,
    hemiSky: 0xe2e8f0,
    hemiGround: 0x1e293b,
    hemiIntensity: 1.18,
    keyIntensity: 1.48,
    rimIntensity: 0.85,
    emerald: 0x10b981,
    amber: 0xf59e0b,
    coral: 0xef4444,
    cyan: 0x38bdf8,
    idleRail: 0x273549,
  },
  light: {
    canvasBg: 0xf4f6f9,
    bloomIntensity: 0.1,
    floorBase: 0xe2e8f0,
    floorTop: 0xf1f5f9,
    floorEdge: 0x94a3b8,
    gridMain: 0xcbd5e1,
    gridSub: 0xdbe2ea,
    desk: 0xffffff,
    deskDark: 0xe2e8f0,
    edge: 0x94a3b8,
    hemiSky: 0xffffff,
    hemiGround: 0xcbd5e1,
    hemiIntensity: 1.15,
    keyIntensity: 0.95,
    rimIntensity: 0.42,
    emerald: 0x047857,
    amber: 0xb45309,
    coral: 0xbe123c,
    cyan: 0x0284c7,
    idleRail: 0xcbd5e1,
  },
} as const;

function tagStation(group: THREE.Object3D, stationId: StationId) {
  group.userData.stationId = stationId;
  group.traverse((child) => {
    child.userData.stationId = stationId;
  });
}

function addEdges(mesh: THREE.Mesh, mat: THREE.LineBasicMaterial) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
  const lines = new THREE.LineSegments(edges, mat);
  mesh.add(lines);
}

function createValidatedCurve(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  const validPoints = points.filter(
    (p): p is THREE.Vector3 =>
      p instanceof THREE.Vector3 &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      Number.isFinite(p.z)
  );
  if (validPoints.length < 2) {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.16, 0),
      new THREE.Vector3(0, 0.16, 0.5),
    ]);
  }
  return new THREE.CatmullRomCurve3(validPoints);
}

interface AnalystFigureRig {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  baseY: number;
}

/**
 * Low-poly architectural mannequin / geometric bust for 3D committee workstations.
 */
function createAnalystFigure(
  accentMat: THREE.Material,
  bodyMat: THREE.MeshStandardMaterial,
  darkMat: THREE.MeshStandardMaterial,
  edgeMat: THREE.LineBasicMaterial
): AnalystFigureRig {
  const root = new THREE.Group();

  // Trapezoid geometric torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.25, 0.42, 4),
    bodyMat
  );
  torso.rotation.y = Math.PI / 4;
  torso.position.y = 0.21;
  torso.castShadow = true;
  addEdges(torso, edgeMat);
  root.add(torso);

  // Architectural collar / accent strip
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.05, 8),
    accentMat
  );
  collar.position.y = 0.44;
  root.add(collar);

  // Geometric head
  const head = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    darkMat
  );
  head.position.y = 0.6;
  head.castShadow = true;
  addEdges(head, edgeMat);
  root.add(head);

  // Subtle visor line
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.03, 0.14),
    accentMat
  );
  visor.position.set(0, 0.61, 0.05);
  root.add(visor);

  return { root, head, torso, baseY: 0.38 };
}

interface WalkingAvatarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Mesh;
  tabletMat: THREE.MeshStandardMaterial;
  waypoints: THREE.Vector3[];
  segmentIndex: number;
  segmentT: number;
  pauseTimer: number;
  walkPhase: number;
}

/**
 * Articulated low-poly architectural avatar that walks along office floor corridors
 * with synchronized leg/arm swing, stride bounce, and glowing telemetry tablet.
 */
function createWalkingAvatar(
  accentColor: number,
  bodyMat: THREE.MeshStandardMaterial,
  darkMat: THREE.MeshStandardMaterial,
  edgeMat: THREE.LineBasicMaterial,
  waypoints: THREE.Vector3[]
): WalkingAvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const tabletMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.1,
    roughness: 0.25,
  });

  // Left & Right Legs (pivoted at hip y = 0.34)
  const makeLeg = (xOffset: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 0.34, 0);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.34, 0.09),
      darkMat
    );
    mesh.position.y = -0.17;
    mesh.castShadow = true;
    pivot.add(mesh);
    bodyGroup.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-0.075);
  const rightLeg = makeLeg(0.075);

  // Torso
  const torso = new THREE.Mesh(
    new RoundedBoxGeometry(0.26, 0.34, 0.16, 2, 0.025),
    bodyMat
  );
  torso.position.y = 0.52;
  torso.castShadow = true;
  addEdges(torso, edgeMat);
  bodyGroup.add(torso);

  // Chest badge accent
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.02),
    tabletMat
  );
  badge.position.set(0, 0.56, 0.085);
  bodyGroup.add(badge);

  // Left & Right Arms (pivoted at shoulder y = 0.64)
  const makeArm = (xOffset: number, withTablet: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 0.64, 0);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.28, 0.08),
      darkMat
    );
    mesh.position.y = -0.13;
    mesh.castShadow = true;
    pivot.add(mesh);
    if (withTablet) {
      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.02, 0.18),
        tabletMat
      );
      tablet.position.set(0, -0.25, 0.08);
      pivot.add(tablet);
    }
    bodyGroup.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-0.175, false);
  const rightArm = makeArm(0.175, true);

  // Head + Visor
  const head = new THREE.Mesh(
    new RoundedBoxGeometry(0.18, 0.18, 0.18, 2, 0.03),
    darkMat
  );
  head.position.y = 0.8;
  head.castShadow = true;
  addEdges(head, edgeMat);
  bodyGroup.add(head);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.035, 0.02),
    tabletMat
  );
  visor.position.set(0, 0.81, 0.095);
  bodyGroup.add(visor);

  const start = waypoints[0] ?? new THREE.Vector3(0, 0.14, 0);
  root.position.copy(start);

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    tabletMat,
    waypoints,
    segmentIndex: 0,
    segmentT: 0,
    pauseTimer: 0,
    walkPhase: 0,
  };
}

function updateWalkingAvatar(
  rig: WalkingAvatarRig,
  dt: number,
  speed: number,
  reducedMotion: boolean
) {
  if (reducedMotion || rig.waypoints.length < 2) return;

  if (rig.pauseTimer > 0) {
    rig.pauseTimer = Math.max(0, rig.pauseTimer - dt);
    // Smoothly settle limbs back to neutral while inspecting desk
    rig.leftLeg.rotation.x *= 0.85;
    rig.rightLeg.rotation.x *= 0.85;
    rig.leftArm.rotation.x *= 0.85;
    rig.rightArm.rotation.x = THREE.MathUtils.lerp(
      rig.rightArm.rotation.x,
      -0.35,
      0.12
    );
    rig.bodyGroup.position.y *= 0.85;
    return;
  }

  const from = rig.waypoints[rig.segmentIndex];
  const nextIdx = (rig.segmentIndex + 1) % rig.waypoints.length;
  const to = rig.waypoints[nextIdx];
  if (!from || !to) return;

  const segDist = Math.max(0.01, from.distanceTo(to));
  rig.segmentT += (dt * speed) / segDist;

  if (rig.segmentT >= 1) {
    rig.segmentT = 0;
    rig.segmentIndex = nextIdx;
    rig.root.position.copy(to);
    rig.pauseTimer = speed > 1.0 ? 0.35 : 1.1;
    return;
  }

  rig.root.position.lerpVectors(from, to, rig.segmentT);

  // Smoothly turn avatar toward walking direction
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const targetYaw = Math.atan2(dx, dz);
  let deltaYaw = targetYaw - rig.root.rotation.y;
  while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
  while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
  rig.root.rotation.y += deltaYaw * Math.min(1, dt * 8);

  // Natural stride cycle (legs opposite, arms counter-swinging, subtle vertical bounce)
  rig.walkPhase += dt * speed * 7.2;
  const swing = Math.sin(rig.walkPhase);
  rig.leftLeg.rotation.x = swing * 0.55;
  rig.rightLeg.rotation.x = -swing * 0.55;
  rig.leftArm.rotation.x = -swing * 0.42;
  rig.rightArm.rotation.x = -0.3 + swing * 0.16;
  rig.bodyGroup.position.y = Math.abs(swing) * 0.032;
}

/**
 * Procedural CanvasTexture for 3D workstation monitors showing crisp telemetry bars and lines.
 */
function createMonitorTexture(accentHex: string, mode: "bars" | "wave" | "grid"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 144;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#080C11";
    ctx.fillRect(0, 0, 256, 144);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let y = 24; y < 144; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Header bar
    ctx.fillStyle = accentHex;
    ctx.fillRect(14, 14, 64, 5);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(90, 14, 42, 5);

    if (mode === "bars") {
      const heights = [36, 58, 44, 78, 62, 86, 52];
      heights.forEach((h, i) => {
        ctx.fillStyle = i === 5 ? accentHex : "rgba(148,163,184,0.45)";
        ctx.fillRect(18 + i * 32, 126 - h, 18, h);
      });
    } else if (mode === "wave") {
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 98);
      ctx.lineTo(54, 82);
      ctx.lineTo(92, 104);
      ctx.lineTo(134, 54);
      ctx.lineTo(176, 72);
      ctx.lineTo(212, 42);
      ctx.lineTo(242, 58);
      ctx.stroke();
    } else {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? accentHex : "rgba(148,163,184,0.35)";
        ctx.fillRect(16, 38 + i * 24, 120 + (i % 3) * 35, 8);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Interactive Architectural 3D Control Room powered by Pure Three.js + OrbitControls
 * + RoundedBoxGeometry + procedural CanvasTexture screens + 3D-projected clickable pins.
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
      ? new THREE.Vector3(0.05, 8.8, 1.05)
      : new THREE.Vector3(4.85, 4.35, 6.45);
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
    floorBaseMat?: THREE.MeshStandardMaterial;
    floorTopMat?: THREE.MeshStandardMaterial;
    deskMat?: THREE.MeshStandardMaterial;
    deskDarkMat?: THREE.MeshStandardMaterial;
    edgeMat?: THREE.LineBasicMaterial;
    floorEdgeMat?: THREE.LineBasicMaterial;
    gridHelper?: THREE.GridHelper;
    scene?: THREE.Scene;
    hemiLight?: THREE.HemisphereLight;
    keyLight?: THREE.DirectionalLight;
    rimLight?: THREE.DirectionalLight;
    bloomEffect?: BloomEffect;
  }>({});

  useEffect(() => {
    stateRef.current.theme = theme;
    stateRef.current.auditPhase = auditPhase;
    stateRef.current.activeAgent = activeAgent;
    stateRef.current.verdictStatus = verdictStatus;
    stateRef.current.macroOrigin = macroOrigin;
    stateRef.current.selectedStation = selectedStation;

    const pal = THEME_PALETTES[theme];
    const refs = themeRefs.current;
    if (refs.scene) {
      refs.scene.background = new THREE.Color(pal.canvasBg);
    }
    if (refs.bloomEffect) {
      refs.bloomEffect.intensity = pal.bloomIntensity;
    }
    if (refs.floorBaseMat) refs.floorBaseMat.color.setHex(pal.floorBase);
    if (refs.floorTopMat) refs.floorTopMat.color.setHex(pal.floorTop);
    if (refs.deskMat) refs.deskMat.color.setHex(pal.desk);
    if (refs.deskDarkMat) refs.deskDarkMat.color.setHex(pal.deskDark);
    if (refs.edgeMat) refs.edgeMat.color.setHex(pal.edge);
    if (refs.floorEdgeMat) refs.floorEdgeMat.color.setHex(pal.floorEdge);
    if (refs.hemiLight) {
      refs.hemiLight.color.setHex(pal.hemiSky);
      refs.hemiLight.groundColor.setHex(pal.hemiGround);
      refs.hemiLight.intensity = pal.hemiIntensity;
    }
    if (refs.keyLight) refs.keyLight.intensity = pal.keyIntensity;
    if (refs.rimLight) refs.rimLight.intensity = pal.rimIntensity;

    if (refs.scene && refs.gridHelper) {
      refs.scene.remove(refs.gridHelper);
      refs.gridHelper.geometry.dispose();
      if (Array.isArray(refs.gridHelper.material)) {
        refs.gridHelper.material.forEach((m) => m.dispose());
      } else {
        refs.gridHelper.material.dispose();
      }
      const nextGrid = new THREE.GridHelper(6.5, 12, pal.gridMain, pal.gridSub);
      nextGrid.position.y = 0.145;
      refs.scene.add(nextGrid);
      refs.gridHelper = nextGrid;
    }
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
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      const tId = setTimeout(() => setWebglError(true), 0);
      return () => clearTimeout(tId);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const initialPal = THEME_PALETTES[stateRef.current.theme];
    scene.background = new THREE.Color(initialPal.canvasBg);

    const camera = new THREE.PerspectiveCamera(27, 16 / 9, 0.1, 100);
    // Slightly asymmetric isometric angle so HERMES and CHAIR never align on screen
    camera.position.set(4.85, 4.35, 6.45);

    // Studio Postprocessing (subtle Bloom on emissive monitors & verdict core)
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

    // Interactive OrbitControls (damped, no scroll-hijacking zoom, clamped vertical angle)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.target.set(0, 0.42, 0);
    controls.update();

    // 3-Point Studio Lighting
    const hemiLight = new THREE.HemisphereLight(
      initialPal.hemiSky,
      initialPal.hemiGround,
      initialPal.hemiIntensity
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      0xfff7ed,
      initialPal.keyIntensity
    );
    keyLight.position.set(6, 11, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 26;
    keyLight.shadow.camera.left = -5.5;
    keyLight.shadow.camera.right = 5.5;
    keyLight.shadow.camera.top = 5.5;
    keyLight.shadow.camera.bottom = -5.5;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(
      0xbae6fd,
      initialPal.rimIntensity
    );
    rimLight.position.set(-7, 6, -6);
    scene.add(rimLight);

    // Emergency Alert Light (glows softly on REJECTED verdict)
    const alertLight = new THREE.PointLight(initialPal.coral, 0, 12);
    alertLight.position.set(0, 2.8, 0);
    scene.add(alertLight);

    // Procedural Monitor CanvasTextures
    const texBars = createMonitorTexture("#10B981", "bars");
    const texWave = createMonitorTexture("#F59E0B", "wave");
    const texGrid = createMonitorTexture("#38BDF8", "grid");

    // Shared Theme-Reactive Materials
    const floorBaseMat = new THREE.MeshStandardMaterial({
      color: initialPal.floorBase,
      roughness: 0.9,
      metalness: 0.06,
    });
    const floorTopMat = new THREE.MeshStandardMaterial({
      color: initialPal.floorTop,
      roughness: 0.8,
      metalness: 0.08,
    });
    const deskMat = new THREE.MeshStandardMaterial({
      color: initialPal.desk,
      roughness: 0.48,
      metalness: 0.16,
    });
    const deskDarkMat = new THREE.MeshStandardMaterial({
      color: initialPal.deskDark,
      roughness: 0.6,
      metalness: 0.25,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: initialPal.edge });
    const floorEdgeMat = new THREE.LineBasicMaterial({
      color: initialPal.floorEdge,
    });

    // 2-Tier Stepped Architectural Base Platform using RoundedBoxGeometry
    const basePlinth = new THREE.Mesh(
      new RoundedBoxGeometry(7.2, 0.12, 7.2, 2, 0.025),
      floorBaseMat
    );
    basePlinth.position.y = 0;
    basePlinth.receiveShadow = true;
    scene.add(basePlinth);

    const topDeck = new THREE.Mesh(
      new RoundedBoxGeometry(6.7, 0.08, 6.7, 2, 0.02),
      floorTopMat
    );
    topDeck.position.y = 0.1;
    topDeck.receiveShadow = true;
    scene.add(topDeck);

    const gridHelper = new THREE.GridHelper(
      6.5,
      12,
      initialPal.gridMain,
      initialPal.gridSub
    );
    gridHelper.position.y = 0.145;
    scene.add(gridHelper);

    // Architectural Floor Walkway Strips & Central Hub Pad for Walking Avatars
    const walkwayMat = new THREE.MeshStandardMaterial({
      color: initialPal.deskDark,
      roughness: 0.72,
      metalness: 0.12,
      transparent: true,
      opacity: 0.65,
    });
    for (const wx of [-0.55, 0.55]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.012, 3.2),
        walkwayMat
      );
      strip.position.set(wx, 0.146, 0);
      strip.receiveShadow = true;
      scene.add(strip);
    }
    const centerHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.56, 0.016, 24),
      walkwayMat
    );
    centerHub.position.set(0, 0.147, 0);
    centerHub.receiveShadow = true;
    scene.add(centerHub);

    // Architectural Semi-Transparent Back Glass Partitions (L-corner studio backdrop)
    const glassMat = new THREE.MeshStandardMaterial({
      color: initialPal.hemiSky,
      transparent: true,
      opacity: stateRef.current.theme === "dark" ? 0.09 : 0.16,
      roughness: 0.15,
      metalness: 0.25,
      depthWrite: false,
    });
    const backWallZ = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 1.25, 0.035),
      glassMat
    );
    backWallZ.position.set(0, 0.77, -3.32);
    addEdges(backWallZ, edgeMat);
    scene.add(backWallZ);

    const backWallX = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 1.25, 6.6),
      glassMat
    );
    backWallX.position.set(-3.32, 0.77, 0);
    addEdges(backWallX, edgeMat);
    scene.add(backWallX);

    // Subtle vertical architectural mullions along the glass corner
    for (const mx of [-3.32, -1.1, 1.1, 3.3]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.28, 0.05),
        deskDarkMat
      );
      post.position.set(mx, 0.78, -3.32);
      scene.add(post);
    }
    for (const mz of [-1.1, 1.1, 3.3]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.28, 0.05),
        deskDarkMat
      );
      post.position.set(-3.32, 0.78, mz);
      scene.add(post);
    }

    // Subtle Zone Overhead Accent Lights (Emerald left, Cyan/Amber right)
    const leftZoneLight = new THREE.PointLight(initialPal.emerald, 0.6, 4.2);
    leftZoneLight.position.set(-1.6, 2.2, 0.2);
    scene.add(leftZoneLight);

    const rightZoneLight = new THREE.PointLight(initialPal.cyan, 0.55, 4.2);
    rightZoneLight.position.set(1.6, 2.2, 0.2);
    scene.add(rightZoneLight);

    themeRefs.current = {
      floorBaseMat,
      floorTopMat,
      deskMat,
      deskDarkMat,
      edgeMat,
      floorEdgeMat,
      gridHelper,
      scene,
      hemiLight,
      keyLight,
      rimLight,
      bloomEffect,
    };

    // Selection / Hover Floor Rings
    const ringMaterials: Record<StationId, THREE.MeshBasicMaterial> = {
      hermes: new THREE.MeshBasicMaterial({
        color: initialPal.emerald,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
      data_analyst: new THREE.MeshBasicMaterial({
        color: initialPal.emerald,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
      risk_manager: new THREE.MeshBasicMaterial({
        color: initialPal.amber,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
      committee_chair: new THREE.MeshBasicMaterial({
        color: initialPal.cyan,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
    };

    const createBaseRing = (id: StationId) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.96, 1.08, 36),
        ringMaterials[id]
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      return ring;
    };

    // === 1. HERMES-00 (Back-Left) ===
    const hermesGroup = new THREE.Group();
    hermesGroup.position.set(-1.72, 0.14, -1.52);
    hermesGroup.add(createBaseRing("hermes"));

    const hermesLedMat = new THREE.MeshStandardMaterial({
      color: initialPal.emerald,
      emissive: initialPal.emerald,
      emissiveIntensity: 0.85,
    });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(
        new RoundedBoxGeometry(1.06, 0.32, 0.78, 2, 0.03),
        i === 1 ? deskDarkMat : deskMat
      );
      blade.position.y = 0.18 + i * 0.36;
      blade.castShadow = true;
      blade.receiveShadow = true;
      hermesGroup.add(blade);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.04, 0.03),
        hermesLedMat
      );
      led.position.set(0, 0.18 + i * 0.36, 0.4);
      hermesGroup.add(led);
    }

    const hermesDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.22),
      new THREE.MeshBasicMaterial({ map: texGrid })
    );
    hermesDisplay.position.set(0, 0.9, 0.405);
    hermesGroup.add(hermesDisplay);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.42, 12),
      deskDarkMat
    );
    mast.position.y = 1.3;
    hermesGroup.add(mast);

    const radarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.028, 10, 32),
      hermesLedMat
    );
    radarRing.position.y = 1.54;
    radarRing.rotation.x = Math.PI / 3;
    hermesGroup.add(radarRing);

    tagStation(hermesGroup, "hermes");
    scene.add(hermesGroup);

    // === 2. DIV-01 Data Analyst (Front-Left) ===
    const analystGroup = new THREE.Group();
    analystGroup.position.set(-1.72, 0.14, 1.48);
    analystGroup.add(createBaseRing("data_analyst"));

    const deskTop1 = new THREE.Mesh(
      new RoundedBoxGeometry(1.46, 0.09, 0.9, 2, 0.02),
      deskMat
    );
    deskTop1.position.y = 0.56;
    deskTop1.castShadow = true;
    deskTop1.receiveShadow = true;
    analystGroup.add(deskTop1);

    for (const [lx, lz] of [
      [-0.62, -0.36],
      [0.62, -0.36],
      [-0.62, 0.36],
      [0.62, 0.36],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.54, 0.06),
        deskDarkMat
      );
      leg.position.set(lx, 0.27, lz);
      analystGroup.add(leg);
    }

    const analystScreenMat = new THREE.MeshStandardMaterial({
      color: initialPal.emerald,
      emissive: initialPal.emerald,
      emissiveIntensity: 0.7,
    });
    const analystTexMat = new THREE.MeshBasicMaterial({ map: texBars });

    for (const [mx, rotY] of [
      [-0.34, 0.2],
      [0.34, -0.2],
    ]) {
      const monitor = new THREE.Mesh(
        new RoundedBoxGeometry(0.6, 0.36, 0.04, 2, 0.01),
        deskDarkMat
      );
      monitor.position.set(mx, 0.86, -0.24);
      monitor.rotation.y = rotY;
      monitor.castShadow = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.54, 0.3),
        analystTexMat
      );
      screen.position.z = 0.024;
      monitor.add(screen);
      analystGroup.add(monitor);
    }

    const holoBars: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(
        new RoundedBoxGeometry(0.12, 0.38, 0.12, 2, 0.015),
        analystScreenMat
      );
      bar.position.set(-0.3 + i * 0.2, 0.8, 0.18);
      analystGroup.add(bar);
      holoBars.push(bar);
    }

    const analystFigure = createAnalystFigure(
      analystScreenMat,
      deskMat,
      deskDarkMat,
      edgeMat
    );
    analystFigure.root.position.set(0, analystFigure.baseY, -0.62);
    analystGroup.add(analystFigure.root);

    tagStation(analystGroup, "data_analyst");
    scene.add(analystGroup);

    // === 3. DIV-02 Risk Manager (Back-Right) ===
    const riskGroup = new THREE.Group();
    riskGroup.position.set(1.72, 0.14, -1.52);
    riskGroup.add(createBaseRing("risk_manager"));

    const deskTop2 = new THREE.Mesh(
      new RoundedBoxGeometry(1.46, 0.09, 0.9, 2, 0.02),
      deskMat
    );
    deskTop2.position.y = 0.56;
    deskTop2.castShadow = true;
    deskTop2.receiveShadow = true;
    riskGroup.add(deskTop2);

    for (const [lx, lz] of [
      [-0.62, -0.36],
      [0.62, -0.36],
      [-0.62, 0.36],
      [0.62, 0.36],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.54, 0.06),
        deskDarkMat
      );
      leg.position.set(lx, 0.27, lz);
      riskGroup.add(leg);
    }

    const wideMonitor = new THREE.Mesh(
      new RoundedBoxGeometry(0.98, 0.38, 0.04, 2, 0.01),
      deskDarkMat
    );
    wideMonitor.position.set(0, 0.88, -0.26);
    wideMonitor.castShadow = true;
    const wideScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.31),
      new THREE.MeshBasicMaterial({ map: texWave })
    );
    wideScreen.position.z = 0.024;
    wideMonitor.add(wideScreen);
    riskGroup.add(wideMonitor);

    const riskPrismMat = new THREE.MeshBasicMaterial({
      color: initialPal.amber,
      wireframe: true,
    });
    const riskPrism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      riskPrismMat
    );
    riskPrism.position.set(0, 1.38, 0.16);
    riskGroup.add(riskPrism);

    const riskFigure = createAnalystFigure(
      riskPrismMat,
      deskMat,
      deskDarkMat,
      edgeMat
    );
    riskFigure.root.position.set(0, riskFigure.baseY, -0.62);
    riskGroup.add(riskFigure.root);

    tagStation(riskGroup, "risk_manager");
    scene.add(riskGroup);

    // === 4. DIV-03 Committee Chair (Front-Right) ===
    const chairGroup = new THREE.Group();
    chairGroup.position.set(1.72, 0.14, 1.48);
    chairGroup.add(createBaseRing("committee_chair"));

    const podiumBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.88, 0.16, 8),
      deskDarkMat
    );
    podiumBase.position.y = 0.08;
    podiumBase.receiveShadow = true;
    chairGroup.add(podiumBase);

    const podiumBody = new THREE.Mesh(
      new RoundedBoxGeometry(1.22, 0.66, 0.88, 2, 0.03),
      deskMat
    );
    podiumBody.position.y = 0.49;
    podiumBody.castShadow = true;
    podiumBody.receiveShadow = true;
    addEdges(podiumBody, edgeMat);
    chairGroup.add(podiumBody);

    const chairCoreMat = new THREE.MeshStandardMaterial({
      color: initialPal.cyan,
      emissive: initialPal.cyan,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.4,
    });
    const chairWireMat = new THREE.MeshBasicMaterial({
      color: initialPal.cyan,
      wireframe: true,
      transparent: true,
      opacity: 0.72,
    });

    const chairCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      chairCoreMat
    );
    chairCore.position.y = 1.32;
    chairGroup.add(chairCore);

    const chairWire = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      chairWireMat
    );
    chairWire.position.y = 1.32;
    chairGroup.add(chairWire);

    const chairFigure = createAnalystFigure(
      chairCoreMat,
      deskMat,
      deskDarkMat,
      edgeMat
    );
    chairFigure.root.position.set(0, 0.42, -0.64);
    chairGroup.add(chairFigure.root);

    tagStation(chairGroup, "committee_chair");
    scene.add(chairGroup);

    const stationGroups: Record<StationId, THREE.Group> = {
      hermes: hermesGroup,
      data_analyst: analystGroup,
      risk_manager: riskGroup,
      committee_chair: chairGroup,
    };
    const interactiveRoots = Object.values(stationGroups);

    const pinAnchors: Record<StationId, THREE.Vector3> = {
      hermes: new THREE.Vector3(-1.85, 1.65, -1.55),
      data_analyst: new THREE.Vector3(-1.85, 1.48, 1.55),
      risk_manager: new THREE.Vector3(1.85, 1.68, -1.55),
      committee_chair: new THREE.Vector3(1.92, 1.72, 1.62),
    };
    const focusTargets: Record<StationId, THREE.Vector3> = {
      hermes: new THREE.Vector3(-0.35, 0.48, -0.35),
      data_analyst: new THREE.Vector3(-0.35, 0.44, 0.35),
      risk_manager: new THREE.Vector3(0.35, 0.46, -0.35),
      committee_chair: new THREE.Vector3(0.35, 0.48, 0.35),
    };
    const projectedVec = new THREE.Vector3();

    // === 2 Articulated Walking Avatars patrolling the War-Room floor ===
    const quantWalker = createWalkingAvatar(
      initialPal.emerald,
      deskMat,
      deskDarkMat,
      edgeMat,
      [
        new THREE.Vector3(-0.65, 0.14, -1.25),
        new THREE.Vector3(-0.45, 0.14, 0.0),
        new THREE.Vector3(-0.65, 0.14, 1.15),
        new THREE.Vector3(-0.45, 0.14, 0.0),
      ]
    );
    scene.add(quantWalker.root);

    const riskWalker = createWalkingAvatar(
      initialPal.amber,
      deskMat,
      deskDarkMat,
      edgeMat,
      [
        new THREE.Vector3(0.65, 0.14, -1.25),
        new THREE.Vector3(0.45, 0.14, 0.0),
        new THREE.Vector3(0.65, 0.14, 1.15),
        new THREE.Vector3(0.45, 0.14, 0.0),
      ]
    );
    riskWalker.segmentIndex = 2;
    scene.add(riskWalker.root);

    // === 3 Floor Circuit Conduits + 3 Emissive Data Packets ===
    const curves = [
      createValidatedCurve([
        new THREE.Vector3(-1.72, 0.16, -0.78),
        new THREE.Vector3(-1.72, 0.16, 0.0),
        new THREE.Vector3(-1.72, 0.16, 0.74),
      ]),
      createValidatedCurve([
        new THREE.Vector3(-0.92, 0.16, 1.48),
        new THREE.Vector3(0.0, 0.16, 0.0),
        new THREE.Vector3(0.92, 0.16, -1.52),
      ]),
      createValidatedCurve([
        new THREE.Vector3(1.72, 0.16, -0.78),
        new THREE.Vector3(1.72, 0.16, 0.0),
        new THREE.Vector3(1.72, 0.16, 0.74),
      ]),
    ];

    const conduitMats = curves.map(
      () =>
        new THREE.MeshBasicMaterial({
          color: initialPal.idleRail,
          transparent: true,
          opacity: 0.65,
        })
    );
    curves.forEach((curve, idx) => {
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.026, 8, false),
        conduitMats[idx]
      );
      scene.add(tube);
    });

    const packetMats = curves.map(
      () =>
        new THREE.MeshStandardMaterial({
          color: initialPal.emerald,
          emissive: initialPal.emerald,
          emissiveIntensity: 1.4,
        })
    );
    const packets = curves.map((_, idx) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        packetMats[idx]
      );
      scene.add(sphere);
      return sphere;
    });

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
      const dist = aspect < 1.25 ? 6.8 : 5.35;
      const currentLen = camera.position.length();
      if (currentLen > 0) {
        const targetLen = Math.sqrt(dist * dist * 2 + (dist * 0.8) ** 2);
        camera.position.setLength(targetLen);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Pointer Raycasting (distinguish click vs orbit drag)
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
      const hitStation = getStationUnderPointer(e);
      stateRef.current.hoveredStation = hitStation;
      canvas.style.cursor = hitStation ? "pointer" : "grab";
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      // Release automated camera preset lerp when user grabs OrbitControls manually
      cameraGoalRef.current = null;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx < 6 && dy < 6) {
        const hitStation = getStationUnderPointer(e);
        if (hitStation) {
          onSelectRef.current(hitStation);
        }
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
    const packetProgress = curves.map(() => 0);
    let wasRejectedVerdict = false;
    let recoilAmplitude = 0;

    const animate = (now: number) => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
      const elapsed = Math.max(0, (now - startTime) / 1000);

      const st = stateRef.current;
      const pal = THEME_PALETTES[st.theme];

      const isRejectedVerdict =
        st.auditPhase === "verdict" && st.verdictStatus === "REJECTED";
      if (isRejectedVerdict && !wasRejectedVerdict && !reducedMotion) {
        recoilAmplitude = 0.09;
      }
      wasRejectedVerdict = isRejectedVerdict;

      if (recoilAmplitude > 0.001) {
        recoilAmplitude *= 0.86;
      } else {
        recoilAmplitude = 0;
      }

      // Smoothly transition camera when user clicks ISO / TOP / RESET preset
      if (cameraGoalRef.current) {
        camera.position.lerp(cameraGoalRef.current, reducedMotion ? 1 : 0.09);
        if (camera.position.distanceTo(cameraGoalRef.current) < 0.05) {
          camera.position.copy(cameraGoalRef.current);
          cameraGoalRef.current = null;
        }
      }

      // Smoothly focus OrbitControls target toward selected station (+ subtle recoil on REJECTED)
      const desiredTarget = focusTargets[st.selectedStation];
      controls.target.lerp(desiredTarget, reducedMotion ? 1 : 0.06);
      if (recoilAmplitude > 0) {
        controls.target.x += Math.sin(elapsed * 48) * recoilAmplitude;
      }
      controls.update();

      // Emergency lighting pulse when REJECTED
      alertLight.color.setHex(pal.coral);
      alertLight.intensity = isRejectedVerdict
        ? reducedMotion
          ? 2.2
          : 1.8 + Math.sin(elapsed * 4.5) * 0.7
        : 0;

      // HERMES-00
      const hermesColor =
        st.macroOrigin === "remote_data_feed" ? pal.emerald : pal.amber;
      hermesLedMat.color.setHex(hermesColor);
      hermesLedMat.emissive.setHex(hermesColor);
      if (!reducedMotion) {
        radarRing.rotation.z += dt * 1.1;
      }

      // DIV-01
      analystScreenMat.color.setHex(pal.emerald);
      analystScreenMat.emissive.setHex(pal.emerald);
      const barSpeed = st.auditPhase === "scanning" ? 5.5 : 1.4;
      holoBars.forEach((bar, i) => {
        const scaleY = reducedMotion
          ? 0.65 + i * 0.15
          : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * barSpeed + i * 1.1));
        bar.scale.y = scaleY;
        bar.position.y = 0.61 + (0.38 * scaleY) / 2;
      });

      // DIV-02
      const riskColor = st.auditPhase === "debating" ? pal.coral : pal.amber;
      (riskPrism.material as THREE.MeshBasicMaterial).color.setHex(riskColor);
      if (!reducedMotion) {
        const riskSpin = st.auditPhase === "debating" ? 2.8 : 0.7;
        riskPrism.rotation.y += dt * riskSpin;
        riskPrism.rotation.x += dt * (riskSpin * 0.4);
        riskPrism.position.y = 1.36 + Math.sin(elapsed * 2) * 0.05;
      }

      // DIV-03
      const verdictColor =
        st.auditPhase === "verdict"
          ? st.verdictStatus === "REJECTED"
            ? pal.coral
            : st.verdictStatus === "CONDITIONAL"
              ? pal.amber
              : pal.emerald
          : pal.cyan;
      chairCoreMat.color.setHex(verdictColor);
      chairCoreMat.emissive.setHex(verdictColor);
      chairWireMat.color.setHex(verdictColor);
      if (!reducedMotion) {
        chairCore.rotation.y += dt * 0.9;
        chairWire.rotation.y -= dt * 0.55;
        chairCore.position.y = 1.32 + Math.sin(elapsed * 1.8) * 0.04;
        chairWire.position.y = chairCore.position.y;

        // Animate 3 architectural analyst figures (subtle breath + active nod when working)
        const analystWorking = st.auditPhase === "scanning";
        analystFigure.root.position.y =
          analystFigure.baseY + Math.sin(elapsed * (analystWorking ? 5.5 : 1.6)) * 0.015;
        analystFigure.head.rotation.x = analystWorking
          ? Math.sin(elapsed * 7) * 0.14
          : Math.sin(elapsed * 1.4) * 0.04;

        const riskWorking = st.auditPhase === "debating";
        riskFigure.root.position.y =
          riskFigure.baseY + Math.sin(elapsed * (riskWorking ? 6 : 1.7) + 1) * 0.015;
        riskFigure.head.rotation.y = riskWorking
          ? Math.sin(elapsed * 5.2) * 0.22
          : Math.sin(elapsed * 1.1) * 0.06;

        const chairWorking = st.auditPhase === "verdict";
        chairFigure.root.position.y =
          0.42 + Math.sin(elapsed * (chairWorking ? 4.5 : 1.5) + 2) * 0.015;
        chairFigure.head.rotation.x = chairWorking
          ? Math.sin(elapsed * 4.5) * 0.12
          : Math.sin(elapsed * 1.2) * 0.03;
      }

      // Update 2 Walking Floor Avatars (faster courier pace during active audit)
      const quantWalkSpeed =
        st.auditPhase === "scanning" ? 1.55 : st.auditPhase === "verdict" ? 0.9 : 0.68;
      quantWalker.tabletMat.color.setHex(pal.emerald);
      quantWalker.tabletMat.emissive.setHex(pal.emerald);
      updateWalkingAvatar(quantWalker, dt, quantWalkSpeed, reducedMotion);

      const riskWalkSpeed =
        st.auditPhase === "debating"
          ? 1.55
          : st.auditPhase === "verdict"
            ? 1.25
            : 0.62;
      const courierColor =
        st.auditPhase === "verdict" ? verdictColor : riskColor;
      riskWalker.tabletMat.color.setHex(courierColor);
      riskWalker.tabletMat.emissive.setHex(courierColor);
      updateWalkingAvatar(riskWalker, dt, riskWalkSpeed, reducedMotion);

      // Floor Rings
      STATION_IDS.forEach((id) => {
        const isSelected = st.selectedStation === id;
        const isHovered = st.hoveredStation === id;
        const isWorking =
          (id === "data_analyst" && st.auditPhase === "scanning") ||
          (id === "risk_manager" && st.auditPhase === "debating") ||
          (id === "committee_chair" && st.auditPhase === "verdict");

        const ringColor =
          id === "hermes"
            ? hermesColor
            : id === "data_analyst"
              ? pal.emerald
              : id === "risk_manager"
                ? riskColor
                : verdictColor;

        ringMaterials[id].color.setHex(ringColor);
        ringMaterials[id].opacity =
          isSelected || isWorking ? 0.8 : isHovered ? 0.52 : 0.16;
      });

      // Conduits & Data Packets
      const phase = st.auditPhase;
      const speeds = [
        phase === "scanning" ? 1.15 : phase === "verdict" ? 0.65 : 0.35,
        phase === "debating" ? 1.15 : phase === "verdict" ? 0.65 : 0,
        phase === "verdict" ? 0.75 : 0,
      ];
      const activeColors = [
        phase === "verdict" ? verdictColor : pal.emerald,
        phase === "verdict"
          ? verdictColor
          : phase === "debating"
            ? pal.amber
            : pal.idleRail,
        phase === "verdict" ? verdictColor : pal.idleRail,
      ];

      for (let idx = 0; idx < curves.length; idx++) {
        const curve = curves[idx];
        const targetPacket = packets[idx];
        const conduitMat = conduitMats[idx];
        const packetMat = packetMats[idx];
        if (!curve || !targetPacket || !conduitMat || !packetMat) continue;

        const speed = speeds[idx] ?? 0;
        const activeColor = activeColors[idx] ?? pal.idleRail;
        const isLit = speed > 0;
        conduitMat.color.setHex(isLit ? activeColor : pal.idleRail);
        conduitMat.opacity = isLit ? 0.85 : 0.35;

        targetPacket.visible = isLit && !reducedMotion;
        if (
          isLit &&
          !reducedMotion &&
          curve.points &&
          curve.points.length >= 2
        ) {
          const nextU = (((packetProgress[idx] ?? 0) + dt * speed) % 1 + 1) % 1;
          const clampedU = Number.isFinite(nextU)
            ? Math.max(0, Math.min(0.999999, nextU))
            : 0;
          packetProgress[idx] = clampedU;
          curve.getPointAt(clampedU, targetPacket.position);
          packetMat.color.setHex(activeColor);
          packetMat.emissive.setHex(activeColor);
        }
      }

      composer.render(dt);

      // Update 3D-Projected Station Pins (clamped inside viewport so none clip off-screen)
      STATION_IDS.forEach((id) => {
        const el = pinRefs.current[id];
        if (!el) return;
        projectedVec.copy(pinAnchors[id]).project(camera);
        const rawPx = (projectedVec.x * 0.5 + 0.5) * viewW;
        const rawPy = (-projectedVec.y * 0.5 + 0.5) * viewH;
        const px = Math.max(46, Math.min(viewW - 46, rawPx));
        const py = Math.max(30, Math.min(viewH - 12, rawPy));
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

      texBars.dispose();
      texWave.dispose();
      texGrid.dispose();

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
      <div className="flex h-[280px] w-full items-center justify-center rounded-sm border border-hairline bg-canvas p-6 text-center sm:h-[340px] lg:h-[390px]">
        <p className="max-w-md font-mono text-xs leading-relaxed text-ink-secondary">
          {fallbackText}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[280px] w-full overflow-hidden bg-canvas sm:h-[340px] lg:h-[390px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Camera View Preset Switcher (ISO / TOP / RESET) */}
      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-0.5 rounded-xs border border-hairline bg-surface/85 p-0.5 backdrop-blur-xs">
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

      {/* 3D-Projected Interactive Station Pins */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STATION_IDS.map((id) => {
          const isSelected = selectedStation === id;
          const isActive =
            (id === "data_analyst" && auditPhase === "scanning") ||
            (id === "risk_manager" && auditPhase === "debating") ||
            (id === "committee_chair" && auditPhase === "verdict") ||
            id === "hermes";

          const dotTone =
            id === "hermes"
              ? macroOrigin === "remote_data_feed"
                ? "bg-cleared"
                : "bg-conditional"
              : id === "risk_manager" && auditPhase === "debating"
                ? "bg-conditional"
                : id === "committee_chair" && auditPhase === "verdict"
                  ? verdictStatus === "REJECTED"
                    ? "bg-rejected"
                    : verdictStatus === "CONDITIONAL"
                      ? "bg-conditional"
                      : "bg-cleared"
                  : isActive
                    ? "bg-cleared"
                    : "bg-ink-muted";

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
                "pointer-events-auto absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-xs transition-colors",
                isSelected
                  ? "border-cleared/70 bg-surface text-ink-primary"
                  : "border-hairline bg-surface/85 text-ink-secondary hover:border-active-border hover:text-ink-primary"
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotTone)}
              />
              <span>{stationLabels[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
