"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
    floorBase: 0x090c10,
    floorTop: 0x0f141b,
    floorEdge: 0x2d3748,
    gridMain: 0x1e293b,
    gridSub: 0x141b24,
    desk: 0x171e28,
    deskDark: 0x10151d,
    edge: 0x334155,
    hemiSky: 0xdbeafe,
    hemiGround: 0x0f172a,
    hemiIntensity: 0.75,
    keyIntensity: 1.1,
    rimIntensity: 0.55,
    emerald: 0x10b981,
    amber: 0xf59e0b,
    coral: 0xef4444,
    cyan: 0x38bdf8,
    idleRail: 0x1e293b,
  },
  light: {
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
    rimIntensity: 0.4,
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
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const lines = new THREE.LineSegments(edges, mat);
  mesh.add(lines);
}

/**
 * Full-Frame Pure Three.js 3D Isometric Architectural War-Room Maquette
 * with 3-point lighting, 3D-projected clickable HTML pins, zero deprecation warnings,
 * theme-reactive materials, and strict WebGL resource disposal.
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

    // Full-Frame Isometric Camera (fills 75-85% of container)
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
    const baseCamPos = new THREE.Vector3(6.3, 5.1, 6.3);
    const lookTarget = new THREE.Vector3(0, 0.42, 0);
    camera.position.copy(baseCamPos);
    camera.lookAt(lookTarget);

    // 3-Point Studio Lighting (Hemisphere Fill + Warm Key + Cool Rim)
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
      roughness: 0.5,
      metalness: 0.18,
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

    // 2-Tier Stepped Architectural Base Platform
    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.12, 7.2),
      floorBaseMat
    );
    basePlinth.position.y = 0;
    basePlinth.receiveShadow = true;
    addEdges(basePlinth, floorEdgeMat);
    scene.add(basePlinth);

    const topDeck = new THREE.Mesh(
      new THREE.BoxGeometry(6.7, 0.08, 6.7),
      floorTopMat
    );
    topDeck.position.y = 0.1;
    topDeck.receiveShadow = true;
    addEdges(topDeck, floorEdgeMat);
    scene.add(topDeck);

    const gridHelper = new THREE.GridHelper(
      6.5,
      12,
      initialPal.gridMain,
      initialPal.gridSub
    );
    gridHelper.position.y = 0.145;
    scene.add(gridHelper);

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
        new THREE.RingGeometry(0.95, 1.08, 36),
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
        new THREE.BoxGeometry(1.05, 0.32, 0.78),
        i === 1 ? deskDarkMat : deskMat
      );
      blade.position.y = 0.18 + i * 0.36;
      blade.castShadow = true;
      blade.receiveShadow = true;
      addEdges(blade, edgeMat);
      hermesGroup.add(blade);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.04, 0.04),
        hermesLedMat
      );
      led.position.set(0, 0.18 + i * 0.36, 0.4);
      hermesGroup.add(led);
    }

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
      new THREE.BoxGeometry(1.45, 0.09, 0.9),
      deskMat
    );
    deskTop1.position.y = 0.56;
    deskTop1.castShadow = true;
    deskTop1.receiveShadow = true;
    addEdges(deskTop1, edgeMat);
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
      transparent: true,
      opacity: 0.88,
    });

    for (const [mx, rotY] of [
      [-0.34, 0.2],
      [0.34, -0.2],
    ]) {
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.36, 0.04),
        deskDarkMat
      );
      monitor.position.set(mx, 0.86, -0.24);
      monitor.rotation.y = rotY;
      monitor.castShadow = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.52, 0.28),
        analystScreenMat
      );
      screen.position.z = 0.025;
      monitor.add(screen);
      analystGroup.add(monitor);
    }

    const holoBars: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.38, 0.12),
        analystScreenMat
      );
      bar.position.set(-0.3 + i * 0.2, 0.8, 0.18);
      analystGroup.add(bar);
      holoBars.push(bar);
    }

    tagStation(analystGroup, "data_analyst");
    scene.add(analystGroup);

    // === 3. DIV-02 Risk Manager (Back-Right) ===
    const riskGroup = new THREE.Group();
    riskGroup.position.set(1.72, 0.14, -1.52);
    riskGroup.add(createBaseRing("risk_manager"));

    const deskTop2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.09, 0.9),
      deskMat
    );
    deskTop2.position.y = 0.56;
    deskTop2.castShadow = true;
    deskTop2.receiveShadow = true;
    addEdges(deskTop2, edgeMat);
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

    const riskAccentMat = new THREE.MeshStandardMaterial({
      color: initialPal.amber,
      emissive: initialPal.amber,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.88,
    });

    const wideMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.38, 0.04),
      deskDarkMat
    );
    wideMonitor.position.set(0, 0.88, -0.26);
    wideMonitor.castShadow = true;
    const wideScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.3),
      riskAccentMat
    );
    wideScreen.position.z = 0.025;
    wideMonitor.add(wideScreen);
    riskGroup.add(wideMonitor);

    const riskPrism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({
        color: initialPal.amber,
        wireframe: true,
      })
    );
    riskPrism.position.set(0, 1.38, 0.16);
    riskGroup.add(riskPrism);

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
      new THREE.BoxGeometry(1.22, 0.66, 0.88),
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

    tagStation(chairGroup, "committee_chair");
    scene.add(chairGroup);

    const stationGroups: Record<StationId, THREE.Group> = {
      hermes: hermesGroup,
      data_analyst: analystGroup,
      risk_manager: riskGroup,
      committee_chair: chairGroup,
    };
    const interactiveRoots = Object.values(stationGroups);

    // 3D anchor points for floating HTML pins
    const pinAnchors: Record<StationId, THREE.Vector3> = {
      hermes: new THREE.Vector3(-1.72, 2.05, -1.52),
      data_analyst: new THREE.Vector3(-1.72, 1.55, 1.48),
      risk_manager: new THREE.Vector3(1.72, 1.9, -1.52),
      committee_chair: new THREE.Vector3(1.72, 1.95, 1.48),
    };
    const projectedVec = new THREE.Vector3();

    // === 3 Floor Circuit Conduits + 3 Emissive Data Packets ===
    const curves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.72, 0.16, -0.78),
        new THREE.Vector3(-1.72, 0.16, 0.0),
        new THREE.Vector3(-1.72, 0.16, 0.74),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.92, 0.16, 1.48),
        new THREE.Vector3(0.0, 0.16, 0.0),
        new THREE.Vector3(0.92, 0.16, -1.52),
      ]),
      new THREE.CatmullRomCurve3([
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

    // ResizeObserver for crisp full-frame proportion across devices
    let aspectScale = 1;
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
      aspectScale =
        aspect < 1.3 ? Math.min(1.5, 1.32 / Math.max(aspect, 0.72)) : 1;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Pointer Raycasting & Subtle Parallax
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    const parallaxTarget = { x: 0, y: 0 };

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
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        parallaxTarget.x = Math.max(-0.4, Math.min(0.4, nx * 0.35));
        parallaxTarget.y = Math.max(-0.3, Math.min(0.3, -ny * 0.25));
      }
      const hitStation = getStationUnderPointer(e);
      stateRef.current.hoveredStation = hitStation;
      canvas.style.cursor = hitStation ? "pointer" : "default";
    };

    const onPointerLeave = () => {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
      stateRef.current.hoveredStation = null;
      canvas.style.cursor = "default";
    };

    const onClick = (e: PointerEvent) => {
      const hitStation = getStationUnderPointer(e);
      if (hitStation) {
        onSelectRef.current(hitStation);
      }
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onClick);

    // Animation Loop using performance.now() (zero THREE.Clock deprecation warning)
    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;
    const packetProgress = [0, 0, 0];

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      const st = stateRef.current;
      const pal = THEME_PALETTES[st.theme];

      const targetX =
        baseCamPos.x * aspectScale + (reducedMotion ? 0 : parallaxTarget.x);
      const targetY =
        baseCamPos.y * aspectScale + (reducedMotion ? 0 : parallaxTarget.y);
      const targetZ =
        baseCamPos.z * aspectScale - (reducedMotion ? 0 : parallaxTarget.x * 0.5);
      camera.position.x += (targetX - camera.position.x) * 0.06;
      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.z += (targetZ - camera.position.z) * 0.06;
      camera.lookAt(lookTarget);

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
      riskAccentMat.color.setHex(riskColor);
      riskAccentMat.emissive.setHex(riskColor);
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
      }

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

      curves.forEach((curve, idx) => {
        const isLit = speeds[idx] > 0;
        conduitMats[idx].color.setHex(isLit ? activeColors[idx] : pal.idleRail);
        conduitMats[idx].opacity = isLit ? 0.85 : 0.35;

        packets[idx].visible = isLit && !reducedMotion;
        if (isLit && !reducedMotion) {
          packetProgress[idx] = (packetProgress[idx] + dt * speeds[idx]) % 1;
          curve.getPointAt(packetProgress[idx], packets[idx].position);
          packetMats[idx].color.setHex(activeColors[idx]);
          packetMats[idx].emissive.setHex(activeColors[idx]);
        }
      });

      renderer.render(scene, camera);

      // Update 3D-Projected Floating Station Pins (60fps direct DOM transform)
      STATION_IDS.forEach((id) => {
        const el = pinRefs.current[id];
        if (!el) return;
        projectedVec.copy(pinAnchors[id]).project(camera);
        const px = (projectedVec.x * 0.5 + 0.5) * viewW;
        const py = (-projectedVec.y * 0.5 + 0.5) * viewH;
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = "1";
      });
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onClick);

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
