"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { AgentRole, AuditPhase } from "@/context/AuditUIContext";
import type { Theme } from "@/context/ThemeContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { VerdictStatus } from "@/lib/schemas/verdictSchema";

export type StationId = "hermes" | AgentRole;

export interface WarRoom3DCanvasProps {
  theme: Theme;
  auditPhase: AuditPhase;
  activeAgent: AgentRole | null;
  verdictStatus?: VerdictStatus;
  macroOrigin: MacroFeedOrigin;
  selectedStation: StationId;
  onSelectStation: (station: StationId) => void;
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

const THEME_PALETTES = {
  dark: {
    floor: 0x0d1117,
    floorEdge: 0x334155,
    gridMain: 0x1e293b,
    gridSub: 0x151c26,
    desk: 0x161c26,
    deskDark: 0x0f141c,
    edge: 0x334155,
    ambientIntensity: 0.7,
    dirIntensity: 1.05,
    emerald: 0x10b981,
    amber: 0xf59e0b,
    coral: 0xef4444,
    cyan: 0x38bdf8,
    idleRail: 0x1e293b,
  },
  light: {
    floor: 0xeef2f6,
    floorEdge: 0x94a3b8,
    gridMain: 0xcbd5e1,
    gridSub: 0xdbe2ea,
    desk: 0xffffff,
    deskDark: 0xe2e8f0,
    edge: 0x94a3b8,
    ambientIntensity: 1.15,
    dirIntensity: 0.9,
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
 * Pure Three.js 3D Isometric Institutional War-Room Maquette.
 * 100% procedural geometry, theme-reactive without remounting WebGL,
 * Raycaster click/hover interaction, and full WebGL resource disposal.
 */
export default function WarRoom3DCanvas({
  theme,
  auditPhase,
  activeAgent,
  verdictStatus,
  macroOrigin,
  selectedStation,
  onSelectStation,
  fallbackText,
}: WarRoom3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Theme & scene material refs for zero-remount live updates
  const themeRefs = useRef<{
    floorMat?: THREE.MeshStandardMaterial;
    deskMat?: THREE.MeshStandardMaterial;
    deskDarkMat?: THREE.MeshStandardMaterial;
    edgeMat?: THREE.LineBasicMaterial;
    floorEdgeMat?: THREE.LineBasicMaterial;
    gridHelper?: THREE.GridHelper;
    scene?: THREE.Scene;
    ambientLight?: THREE.AmbientLight;
    dirLight?: THREE.DirectionalLight;
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
    if (refs.floorMat) refs.floorMat.color.setHex(pal.floor);
    if (refs.deskMat) refs.deskMat.color.setHex(pal.desk);
    if (refs.deskDarkMat) refs.deskDarkMat.color.setHex(pal.deskDark);
    if (refs.edgeMat) refs.edgeMat.color.setHex(pal.edge);
    if (refs.floorEdgeMat) refs.floorEdgeMat.color.setHex(pal.floorEdge);
    if (refs.ambientLight) refs.ambientLight.intensity = pal.ambientIntensity;
    if (refs.dirLight) refs.dirLight.intensity = pal.dirIntensity;

    // Rebuild lightweight GridHelper colors cleanly on theme swap
    if (refs.scene && refs.gridHelper) {
      refs.scene.remove(refs.gridHelper);
      refs.gridHelper.geometry.dispose();
      if (Array.isArray(refs.gridHelper.material)) {
        refs.gridHelper.material.forEach((m) => m.dispose());
      } else {
        refs.gridHelper.material.dispose();
      }
      const nextGrid = new THREE.GridHelper(6.6, 12, pal.gridMain, pal.gridSub);
      nextGrid.position.y = 0.085;
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const initialPal = THEME_PALETTES[stateRef.current.theme];

    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100);
    const baseCamPos = new THREE.Vector3(8.6, 7.2, 8.6);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0.35, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      initialPal.ambientIntensity
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      0xffffff,
      initialPal.dirIntensity
    );
    dirLight.position.set(7, 12, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    scene.add(dirLight);

    // Shared Theme-Reactive Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: initialPal.floor,
      roughness: 0.85,
      metalness: 0.08,
    });
    const deskMat = new THREE.MeshStandardMaterial({
      color: initialPal.desk,
      roughness: 0.55,
      metalness: 0.18,
    });
    const deskDarkMat = new THREE.MeshStandardMaterial({
      color: initialPal.deskDark,
      roughness: 0.65,
      metalness: 0.25,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: initialPal.edge });
    const floorEdgeMat = new THREE.LineBasicMaterial({
      color: initialPal.floorEdge,
    });

    // Architectural Base Platform
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.16, 6.8),
      floorMat
    );
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    addEdges(floorMesh, floorEdgeMat);
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(
      6.6,
      12,
      initialPal.gridMain,
      initialPal.gridSub
    );
    gridHelper.position.y = 0.085;
    scene.add(gridHelper);

    themeRefs.current = {
      floorMat,
      deskMat,
      deskDarkMat,
      edgeMat,
      floorEdgeMat,
      gridHelper,
      scene,
      ambientLight,
      dirLight,
    };

    // Selection / Hover Floor Rings
    const ringMaterials: Record<StationId, THREE.MeshBasicMaterial> = {
      hermes: new THREE.MeshBasicMaterial({
        color: initialPal.emerald,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
      data_analyst: new THREE.MeshBasicMaterial({
        color: initialPal.emerald,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
      risk_manager: new THREE.MeshBasicMaterial({
        color: initialPal.amber,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
      committee_chair: new THREE.MeshBasicMaterial({
        color: initialPal.cyan,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
    };

    const createBaseRing = (id: StationId) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1.04, 32),
        ringMaterials[id]
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      return ring;
    };

    // === 1. HERMES-00 (Back-Left: Server Rack + Rotating Radar Ring) ===
    const hermesGroup = new THREE.Group();
    hermesGroup.position.set(-1.75, 0.08, -1.55);
    hermesGroup.add(createBaseRing("hermes"));

    const hermesLedMat = new THREE.MeshStandardMaterial({
      color: initialPal.emerald,
      emissive: initialPal.emerald,
      emissiveIntensity: 0.9,
    });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.3, 0.72),
        i === 1 ? deskDarkMat : deskMat
      );
      blade.position.y = 0.18 + i * 0.34;
      blade.castShadow = true;
      blade.receiveShadow = true;
      addEdges(blade, edgeMat);
      hermesGroup.add(blade);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.04, 0.04),
        hermesLedMat
      );
      led.position.set(0, 0.18 + i * 0.34, 0.37);
      hermesGroup.add(led);
    }

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.42, 12),
      deskDarkMat
    );
    mast.position.y = 1.25;
    hermesGroup.add(mast);

    const radarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.025, 10, 28),
      hermesLedMat
    );
    radarRing.position.y = 1.48;
    radarRing.rotation.x = Math.PI / 3;
    hermesGroup.add(radarRing);

    tagStation(hermesGroup, "hermes");
    scene.add(hermesGroup);

    // === 2. DIV-01 Data Analyst (Front-Left: Dual Monitors + 3D Bar Chart) ===
    const analystGroup = new THREE.Group();
    analystGroup.position.set(-1.75, 0.08, 1.45);
    analystGroup.add(createBaseRing("data_analyst"));

    const deskTop1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.08, 0.85),
      deskMat
    );
    deskTop1.position.y = 0.54;
    deskTop1.castShadow = true;
    deskTop1.receiveShadow = true;
    addEdges(deskTop1, edgeMat);
    analystGroup.add(deskTop1);

    for (const [lx, lz] of [
      [-0.58, -0.34],
      [0.58, -0.34],
      [-0.58, 0.34],
      [0.58, 0.34],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.52, 0.06),
        deskDarkMat
      );
      leg.position.set(lx, 0.26, lz);
      analystGroup.add(leg);
    }

    const analystScreenMat = new THREE.MeshStandardMaterial({
      color: initialPal.emerald,
      emissive: initialPal.emerald,
      emissiveIntensity: 0.75,
    });

    for (const [mx, rotY] of [
      [-0.32, 0.2],
      [0.32, -0.2],
    ]) {
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.34, 0.04),
        deskDarkMat
      );
      monitor.position.set(mx, 0.82, -0.22);
      monitor.rotation.y = rotY;
      monitor.castShadow = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.26),
        analystScreenMat
      );
      screen.position.z = 0.025;
      monitor.add(screen);
      analystGroup.add(monitor);
    }

    // Mini 3D Hologram Bars
    const holoBars: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.34, 0.11),
        analystScreenMat
      );
      bar.position.set(-0.27 + i * 0.18, 0.76, 0.18);
      analystGroup.add(bar);
      holoBars.push(bar);
    }

    tagStation(analystGroup, "data_analyst");
    scene.add(analystGroup);

    // === 3. DIV-02 Risk Manager (Back-Right: Wide Monitor + Floating Shield Prism) ===
    const riskGroup = new THREE.Group();
    riskGroup.position.set(1.75, 0.08, -1.55);
    riskGroup.add(createBaseRing("risk_manager"));

    const deskTop2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.08, 0.85),
      deskMat
    );
    deskTop2.position.y = 0.54;
    deskTop2.castShadow = true;
    deskTop2.receiveShadow = true;
    addEdges(deskTop2, edgeMat);
    riskGroup.add(deskTop2);

    for (const [lx, lz] of [
      [-0.58, -0.34],
      [0.58, -0.34],
      [-0.58, 0.34],
      [0.58, 0.34],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.52, 0.06),
        deskDarkMat
      );
      leg.position.set(lx, 0.26, lz);
      riskGroup.add(leg);
    }

    const riskAccentMat = new THREE.MeshStandardMaterial({
      color: initialPal.amber,
      emissive: initialPal.amber,
      emissiveIntensity: 0.75,
    });

    const wideMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.36, 0.04),
      deskDarkMat
    );
    wideMonitor.position.set(0, 0.84, -0.24);
    wideMonitor.castShadow = true;
    const wideScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.28),
      riskAccentMat
    );
    wideScreen.position.z = 0.025;
    wideMonitor.add(wideScreen);
    riskGroup.add(wideMonitor);

    const riskPrism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({
        color: initialPal.amber,
        wireframe: true,
      })
    );
    riskPrism.position.set(0, 1.32, 0.14);
    riskGroup.add(riskPrism);

    tagStation(riskGroup, "risk_manager");
    scene.add(riskGroup);

    // === 4. DIV-03 Committee Chair (Front-Right: Command Podium + Dual Hologram Core) ===
    const chairGroup = new THREE.Group();
    chairGroup.position.set(1.75, 0.08, 1.45);
    chairGroup.add(createBaseRing("committee_chair"));

    const podiumBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.84, 0.16, 8),
      deskDarkMat
    );
    podiumBase.position.y = 0.08;
    podiumBase.receiveShadow = true;
    chairGroup.add(podiumBase);

    const podiumBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.62, 0.82),
      deskMat
    );
    podiumBody.position.y = 0.47;
    podiumBody.castShadow = true;
    podiumBody.receiveShadow = true;
    addEdges(podiumBody, edgeMat);
    chairGroup.add(podiumBody);

    const chairCoreMat = new THREE.MeshStandardMaterial({
      color: initialPal.cyan,
      emissive: initialPal.cyan,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.4,
    });
    const chairWireMat = new THREE.MeshBasicMaterial({
      color: initialPal.cyan,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });

    const chairCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      chairCoreMat
    );
    chairCore.position.y = 1.24;
    chairGroup.add(chairCore);

    const chairWire = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      chairWireMat
    );
    chairWire.position.y = 1.24;
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

    // === 3 Floor Circuit Conduits + 3 Emissive Data Packets ===
    const curves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.75, 0.12, -0.8),
        new THREE.Vector3(-1.75, 0.12, 0.0),
        new THREE.Vector3(-1.75, 0.12, 0.72),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.98, 0.12, 1.45),
        new THREE.Vector3(0.0, 0.12, 0.0),
        new THREE.Vector3(0.98, 0.12, -1.55),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.75, 0.12, -0.8),
        new THREE.Vector3(1.75, 0.12, 0.0),
        new THREE.Vector3(1.75, 0.12, 0.72),
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
        new THREE.TubeGeometry(curve, 24, 0.024, 8, false),
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
        new THREE.SphereGeometry(0.085, 12, 12),
        packetMats[idx]
      );
      scene.add(sphere);
      return sphere;
    });

    // ResizeObserver for crisp responsiveness on Mobile, iPad, Desktop
    let aspectScale = 1;
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      const aspect = w / h;
      camera.aspect = aspect;
      aspectScale = aspect < 1.25 ? Math.min(1.55, 1.32 / Math.max(aspect, 0.65)) : 1;
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
        parallaxTarget.x = Math.max(-0.45, Math.min(0.45, nx * 0.4));
        parallaxTarget.y = Math.max(-0.35, Math.min(0.35, -ny * 0.3));
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

    // Animation Loop
    let rafId = 0;
    const clock = new THREE.Clock();
    const packetProgress = [0, 0, 0];

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const st = stateRef.current;
      const pal = THEME_PALETTES[st.theme];

      // Subtle camera parallax lerp
      const targetX = baseCamPos.x * aspectScale + (reducedMotion ? 0 : parallaxTarget.x);
      const targetY = baseCamPos.y * aspectScale + (reducedMotion ? 0 : parallaxTarget.y);
      const targetZ = baseCamPos.z * aspectScale - (reducedMotion ? 0 : parallaxTarget.x * 0.5);
      camera.position.x += (targetX - camera.position.x) * 0.06;
      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.z += (targetZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0.35, 0);

      // HERMES-00 color & radar spin
      const hermesColor =
        st.macroOrigin === "remote_data_feed" ? pal.emerald : pal.amber;
      hermesLedMat.color.setHex(hermesColor);
      hermesLedMat.emissive.setHex(hermesColor);
      if (!reducedMotion) {
        radarRing.rotation.z += dt * 1.1;
      }

      // DIV-01 Bar Chart Pulse
      analystScreenMat.color.setHex(pal.emerald);
      analystScreenMat.emissive.setHex(pal.emerald);
      const barSpeed = st.auditPhase === "scanning" ? 5.5 : 1.4;
      holoBars.forEach((bar, i) => {
        const scaleY = reducedMotion
          ? 0.65 + i * 0.15
          : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * barSpeed + i * 1.1));
        bar.scale.y = scaleY;
        bar.position.y = 0.58 + (0.34 * scaleY) / 2;
      });

      // DIV-02 Risk Prism Spin
      const riskColor = st.auditPhase === "debating" ? pal.coral : pal.amber;
      riskAccentMat.color.setHex(riskColor);
      riskAccentMat.emissive.setHex(riskColor);
      (riskPrism.material as THREE.MeshBasicMaterial).color.setHex(riskColor);
      if (!reducedMotion) {
        const riskSpin = st.auditPhase === "debating" ? 2.8 : 0.7;
        riskPrism.rotation.y += dt * riskSpin;
        riskPrism.rotation.x += dt * (riskSpin * 0.4);
        riskPrism.position.y = 1.3 + Math.sin(elapsed * 2) * 0.05;
      }

      // DIV-03 Committee Chair Hologram Core
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
        chairCore.position.y = 1.24 + Math.sin(elapsed * 1.8) * 0.04;
        chairWire.position.y = chairCore.position.y;
      }

      // Hover & Selection Floor Ring Highlights
      (["hermes", "data_analyst", "risk_manager", "committee_chair"] as const).forEach(
        (id) => {
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
          ringMaterials[id].opacity = isSelected || isWorking ? 0.78 : isHovered ? 0.5 : 0.16;
        }
      );

      // Floor Circuit Conduits & Data Packets
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
    };

    animate();

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
      <div className="flex h-[240px] w-full items-center justify-center rounded-sm border border-hairline bg-canvas p-6 text-center sm:h-[290px] lg:h-[330px]">
        <p className="max-w-md font-mono text-xs leading-relaxed text-ink-secondary">
          {fallbackText}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[240px] w-full overflow-hidden rounded-sm border border-hairline bg-canvas sm:h-[290px] lg:h-[330px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
