"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ScenarioMode = "risky" | "safe";

interface GateMeta {
  id: number;
  code: string;
  shortLabel: string;
  title: string;
  x: number;
  colorHex: number;
  accentText: string;
  badgeClass: string;
  riskySummary: string;
  safeSummary: string;
}

const GATES: readonly GateMeta[] = [
  {
    id: 0,
    code: "01",
    shortLabel: "Validasi",
    title: "01 · Validasi Input (Zod)",
    x: -5.4,
    colorHex: 0x38bdf8,
    accentText: "text-sky-300",
    badgeClass: "border-sky-400/50 bg-sky-500/20 text-sky-200",
    riskySummary: "Format nominal modal, target profit, dan batas rugi lolos pemeriksaan tipe data.",
    safeSummary: "Semua angka rencana tervalidasi bersih tanpa input cacat atau nilai negatif.",
  },
  {
    id: 1,
    code: "02",
    shortLabel: "Rumus Eksak",
    title: "02 · Hitungan Eksak (Decimal.js)",
    x: -2.7,
    colorHex: 0x10b981,
    accentText: "text-emerald-300",
    badgeClass: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
    riskySummary: "Menghitung R:R bersih 1 : 0.86 setelah fee — terdeteksi tidak sebanding dengan risikonya.",
    safeSummary: "Menghitung R:R bersih 1 : 2.50 dengan risiko modal terjaga di 1.4% per posisi.",
  },
  {
    id: 2,
    code: "03",
    shortLabel: "Radar Pasar",
    title: "03 · Radar Pasar Harian (Hermes)",
    x: 0,
    colorHex: 0xf59e0b,
    accentText: "text-amber-300",
    badgeClass: "border-amber-400/50 bg-amber-500/20 text-amber-200",
    riskySummary: "Rezim pasar RISK_OFF: volatilitas tinggi memperketat jarak aman Stop-Loss (ATR-14).",
    safeSummary: "Jarak Stop-Loss sudah lebih lebar dari gejolak harian pasar (1.6x ATR-14).",
  },
  {
    id: 3,
    code: "04",
    shortLabel: "Veto Keras",
    title: "04 · Gerbang Veto Keras (Hard Rule)",
    x: 2.7,
    colorHex: 0xf43f5e,
    accentText: "text-rose-300",
    badgeClass: "border-rose-400/60 bg-rose-500/25 text-rose-200",
    riskySummary: "PERISAI AKTIF: Rencana diblokir otomatis karena R:R < 1.5 & porsi modal terlalu agresif!",
    safeSummary: "Lolos tanpa veto: tidak ada pelanggaran rasio rugi, cicilan OJK, atau batas aman.",
  },
  {
    id: 4,
    code: "05",
    shortLabel: "Monte Carlo",
    title: "05 · 1.000 Skenario & Vonis",
    x: 5.4,
    colorHex: 0x34d399,
    accentText: "text-emerald-300",
    badgeClass: "border-emerald-400/60 bg-emerald-500/25 text-emerald-200",
    riskySummary: "Sisa jalur yang lolos diuji 1.000x: risiko bangkrut 17.7% → Vonis: TUNDA / PERBAIKI.",
    safeSummary: "1.000 simulasi acak bercabang ke zona P5–P95: peluang bertahan 98.8% → LAYAK.",
  },
] as const;

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 3.3, 10.6);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.2, 0);

interface OrbEntity {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  willVeto: boolean;
  vetoed: boolean;
  branchOffset: number;
  branchY: number;
  life: number;
  trailSeed: number;
}

interface SparkEntity {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export default function MethodologyGate3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [scenario, setScenario] = useState<ScenarioMode>("risky");
  const [selectedGate, setSelectedGate] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [counts, setCounts] = useState<{ passed: number; vetoed: number }>({
    passed: 0,
    vetoed: 0,
  });

  const scenarioRef = useRef<ScenarioMode>(scenario);
  const selectedGateRef = useRef<number>(selectedGate);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const cameraLerpRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: DEFAULT_CAMERA_POS.clone(),
    target: DEFAULT_TARGET.clone(),
  });
  const burstTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    selectedGateRef.current = selectedGate;
  }, [selectedGate]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const focusGateCamera = useCallback((gateIdx: number) => {
    setSelectedGate(gateIdx);
    const gate = GATES[gateIdx];
    cameraLerpRef.current = {
      active: true,
      pos: new THREE.Vector3(gate.x * 0.72, 2.35, 7.2),
      target: new THREE.Vector3(gate.x * 0.85, 0.2, 0),
    };
  }, []);

  const resetCamera = useCallback(() => {
    cameraLerpRef.current = {
      active: true,
      pos: DEFAULT_CAMERA_POS.clone(),
      target: DEFAULT_TARGET.clone(),
    };
  }, []);

  const handleScenarioSwitch = useCallback((next: ScenarioMode) => {
    setScenario(next);
    setSelectedGate(next === "risky" ? 3 : 4);
    setCounts({ passed: 0, vetoed: 0 });
    cameraLerpRef.current = {
      active: true,
      pos: DEFAULT_CAMERA_POS.clone(),
      target: DEFAULT_TARGET.clone(),
    };
    // Fire a fresh burst after switching so user immediately sees the difference
    setTimeout(() => {
      burstTriggerRef.current?.();
    }, 60);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b11);
    scene.fog = new THREE.FogExp2(0x060b11, 0.032);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.copy(DEFAULT_CAMERA_POS);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 16;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.target.copy(DEFAULT_TARGET);
    renderer.domElement.style.touchAction = "pan-y";

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      isPlayingRef.current = false;
    }

    const cancelLerp = () => {
      cameraLerpRef.current.active = false;
    };
    controls.addEventListener("start", cancelLerp);

    // Lighting — crisp jewel tones, no washed-out environment
    const ambientLight = new THREE.AmbientLight(0xb8d4f0, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(5, 11, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-8, 5, -6);
    scene.add(rimLight);

    // Lab floor grid & subtle reflective base plane
    const floorGeo = new THREE.PlaneGeometry(28, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x08101a,
      roughness: 0.72,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.75;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x16324a, 0x0d1c2b);
    grid.position.y = -1.74;
    scene.add(grid);

    // Main decision rail from input emitter to Monte Carlo fan
    const railPoints = [
      new THREE.Vector3(-7.4, 0.15, 0),
      new THREE.Vector3(-5.4, 0.15, 0),
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(5.4, 0.15, 0),
    ];
    const railCurve = new THREE.CatmullRomCurve3(railPoints);
    const railGeo = new THREE.TubeGeometry(railCurve, 64, 0.032, 10, false);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.6,
    });
    scene.add(new THREE.Mesh(railGeo, railMat));

    // Left Input Emitter Core
    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(-7.5, 0.15, 0);
    const emitterCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 1),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.1,
        roughness: 0.2,
        metalness: 0.7,
      })
    );
    emitterGroup.add(emitterCore);
    scene.add(emitterGroup);

    // Build 5 Architectural 3D Gate Portals
    interface GateObjects {
      group: THREE.Group;
      outerRing: THREE.Mesh;
      innerGyro: THREE.Mesh;
      scanPlane: THREE.Mesh;
      pedestalGlow: THREE.Mesh;
      pulse: number;
      baseColor: number;
    }

    const gateObjects: GateObjects[] = [];
    const portalMatBase = new THREE.MeshStandardMaterial({
      color: 0x152232,
      roughness: 0.35,
      metalness: 0.82,
    });

    GATES.forEach((gate) => {
      const group = new THREE.Group();
      group.position.set(gate.x, 0.15, 0);

      // Metallic architectural outer ring
      const frameRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.08, 16, 48),
        portalMatBase
      );
      frameRing.rotation.y = Math.PI / 2;
      group.add(frameRing);

      // Glowing inner scanner ring
      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.98, 0.045, 16, 48),
        new THREE.MeshStandardMaterial({
          color: gate.colorHex,
          emissive: gate.colorHex,
          emissiveIntensity: 0.95,
          roughness: 0.2,
          metalness: 0.5,
        })
      );
      outerRing.rotation.y = Math.PI / 2;
      group.add(outerRing);

      // Rotating gyroscope ring
      const innerGyro = new THREE.Mesh(
        new THREE.TorusGeometry(0.76, 0.024, 12, 36, Math.PI * 1.45),
        new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          emissive: gate.colorHex,
          emissiveIntensity: 0.65,
          roughness: 0.25,
          metalness: 0.8,
        })
      );
      innerGyro.rotation.y = Math.PI / 2;
      group.add(innerGyro);

      // Translucent scanner field (intensifies on Gate 4 when veto shield is active)
      const scanPlane = new THREE.Mesh(
        new THREE.CircleGeometry(0.92, 36),
        new THREE.MeshBasicMaterial({
          color: gate.colorHex,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      scanPlane.rotation.y = Math.PI / 2;
      group.add(scanPlane);

      // Floor pedestal pad under each gate
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.82, 0.12, 24),
        portalMatBase
      );
      pedestal.position.y = -1.83;
      group.add(pedestal);

      const pedestalGlow = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.68, 32),
        new THREE.MeshBasicMaterial({
          color: gate.colorHex,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
      );
      pedestalGlow.rotation.x = -Math.PI / 2;
      pedestalGlow.position.y = -1.76;
      group.add(pedestalGlow);

      // Pillar connecting floor pedestal to portal frame
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.65, 0.18),
        portalMatBase
      );
      strut.position.y = -1.46;
      group.add(strut);

      scene.add(group);
      gateObjects.push({
        group,
        outerRing,
        innerGyro,
        scanPlane,
        pedestalGlow,
        pulse: 0,
        baseColor: gate.colorHex,
      });
    });

    // Gate 4 Veto Deflection Sink (red containment ring below Gate 4)
    const vetoSink = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.04, 12, 36),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 1.1,
        roughness: 0.25,
      })
    );
    vetoSink.rotation.x = Math.PI / 2;
    vetoSink.position.set(GATES[3].x, -1.68, 1.35);
    scene.add(vetoSink);

    // Gate 5 Monte Carlo 3-Branch Probability Fan (P95, P50, P5) + Target Core
    const branchConfigs = [
      { yEnd: 1.05, zEnd: -0.65, color: 0x34d399 }, // P95 Optimis
      { yEnd: 0.15, zEnd: 0, color: 0x10b981 }, // P50 Median
      { yEnd: -0.65, zEnd: 0.65, color: 0xf59e0b }, // P5 Konservatif
    ];
    branchConfigs.forEach((b) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(5.4, 0.15, 0),
        new THREE.Vector3(6.6, (0.15 + b.yEnd) * 0.5, b.zEnd * 0.5),
        new THREE.Vector3(7.9, b.yEnd, b.zEnd),
      ]);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.022, 8, false),
        new THREE.MeshStandardMaterial({
          color: b.color,
          emissive: b.color,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.85,
        })
      );
      scene.add(tube);
    });

    const targetCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.38, 1),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.1,
        roughness: 0.2,
        metalness: 0.6,
        wireframe: true,
      })
    );
    targetCore.position.set(8.0, 0.15, 0);
    scene.add(targetCore);

    // Orbs & Sparks pools
    const orbGeo = new THREE.SphereGeometry(0.115, 16, 16);
    const sparkGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const orbs: OrbEntity[] = [];
    const sparks: SparkEntity[] = [];

    const spawnSparkBurst = (x: number, y: number, z: number, colorHex: number, count = 7) => {
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.95,
        });
        const mesh = new THREE.Mesh(sparkGeo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        sparks.push({
          mesh,
          vx: (Math.random() - 0.6) * 2.4,
          vy: (Math.random() - 0.2) * 2.4,
          vz: (Math.random() - 0.5) * 2.4,
          life: 0.65,
        });
      }
    };

    const spawnOrb = (startX = -7.35) => {
      const mode = scenarioRef.current;
      // In risky mode, ~78% of incoming plans get vetoed at Gate 4; in safe mode, 0% get vetoed
      const willVeto = mode === "risky" ? Math.random() < 0.78 : false;
      const initialColor = mode === "risky" ? 0xf59e0b : 0x10b981;
      const mat = new THREE.MeshStandardMaterial({
        color: initialColor,
        emissive: initialColor,
        emissiveIntensity: 1.25,
        roughness: 0.15,
      });
      const mesh = new THREE.Mesh(orbGeo, mat);
      const yJitter = (Math.random() - 0.5) * 0.28;
      const zJitter = (Math.random() - 0.5) * 0.28;
      mesh.position.set(startX, 0.15 + yJitter, zJitter);
      scene.add(mesh);

      const branchPick = Math.random();
      const branchY = branchPick > 0.68 ? 1.05 : branchPick < 0.3 ? -0.65 : 0.15;
      const branchOffset = branchPick > 0.68 ? -0.65 : branchPick < 0.3 ? 0.65 : 0;

      orbs.push({
        mesh,
        x: startX,
        y: 0.15 + yJitter,
        z: zJitter,
        vx: 2.85 + Math.random() * 0.65,
        vy: 0,
        vz: 0,
        willVeto,
        vetoed: false,
        branchOffset,
        branchY,
        life: 1,
        trailSeed: Math.random() * 10,
      });
    };

    // Seed initial stream so the canvas is alive immediately on mount
    [-6.5, -4.4, -2.1, 0.4, 2.0].forEach((sx) => spawnOrb(sx));

    burstTriggerRef.current = () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          spawnOrb(-7.35);
        }, i * 75);
      }
    };

    let spawnTimer = 0;
    let passedDelta = 0;
    let vetoedDelta = 0;
    let countFlushTimer = 0;
    let animId = 0;
    const clock = new THREE.Clock();
    const projVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const playing = isPlayingRef.current;
      const mode = scenarioRef.current;
      const activeGate = selectedGateRef.current;

      // Smooth camera focus transition if triggered
      if (cameraLerpRef.current.active) {
        camera.position.lerp(cameraLerpRef.current.pos, 0.08);
        controls.target.lerp(cameraLerpRef.current.target, 0.08);
        if (camera.position.distanceTo(cameraLerpRef.current.pos) < 0.04) {
          cameraLerpRef.current.active = false;
        }
      }

      emitterCore.rotation.y += dt * 1.1;
      emitterCore.rotation.x += dt * 0.6;
      targetCore.rotation.y -= dt * 0.85;
      targetCore.rotation.z += dt * 0.45;

      // Gate animations & highlight state
      gateObjects.forEach((gObj, idx) => {
        const isSelected = idx === activeGate;
        gObj.innerGyro.rotation.x += dt * (0.7 + idx * 0.14);
        gObj.pulse = Math.max(0, gObj.pulse - dt * 2.4);

        const ringMat = gObj.outerRing.material as THREE.MeshStandardMaterial;
        const scanMat = gObj.scanPlane.material as THREE.MeshBasicMaterial;
        const padMat = gObj.pedestalGlow.material as THREE.MeshBasicMaterial;

        const isVetoShield = idx === 3 && mode === "risky";
        ringMat.emissiveIntensity =
          (isSelected ? 1.55 : isVetoShield ? 1.35 : 0.75) + gObj.pulse * 1.1;
        scanMat.opacity = isVetoShield
          ? 0.24 + Math.sin(elapsed * 5) * 0.06 + gObj.pulse * 0.2
          : (isSelected ? 0.18 : 0.07) + gObj.pulse * 0.18;
        padMat.opacity = isSelected ? 0.85 : 0.35;

        const targetScale = isSelected ? 1.07 : 1.0;
        gObj.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });

      // Spawn & move orbs when playing
      if (playing) {
        spawnTimer += dt;
        if (spawnTimer > 0.48) {
          spawnTimer = 0;
          if (orbs.length < 28) spawnOrb(-7.35);
        }

        for (let i = orbs.length - 1; i >= 0; i--) {
          const orb = orbs[i];
          const prevX = orb.x;

          if (!orb.vetoed) {
            orb.x += orb.vx * dt;

            // Check gate crossings for pulse feedback
            for (let gIdx = 0; gIdx < GATES.length; gIdx++) {
              const gx = GATES[gIdx].x;
              if (prevX < gx && orb.x >= gx) {
                if (gIdx === 3 && orb.willVeto) {
                  // VETO COLLISION AT GATE 4!
                  orb.vetoed = true;
                  orb.vx = -0.55 - Math.random() * 0.4;
                  orb.vy = -0.35;
                  orb.vz = 1.1 + Math.random() * 0.4;
                  const mat = orb.mesh.material as THREE.MeshStandardMaterial;
                  mat.color.setHex(0xf43f5e);
                  mat.emissive.setHex(0xe11d48);
                  gateObjects[3].pulse = 1;
                  spawnSparkBurst(gx - 0.1, orb.y, orb.z, 0xf43f5e, 8);
                  vetoedDelta += 1;
                  break;
                } else {
                  gateObjects[gIdx].pulse = 0.85;
                  if (gIdx >= 3) {
                    const mat = orb.mesh.material as THREE.MeshStandardMaterial;
                    mat.color.setHex(0x10b981);
                    mat.emissive.setHex(0x10b981);
                  }
                }
              }
            }

            // Gentle sine wave before Gate 5; fan out along Monte Carlo cone after Gate 5
            if (orb.x > GATES[4].x) {
              const t = Math.min(1, (orb.x - GATES[4].x) / 2.5);
              orb.y = THREE.MathUtils.lerp(orb.y, orb.branchY, t * 0.12);
              orb.z = THREE.MathUtils.lerp(orb.z, orb.branchOffset, t * 0.12);
            } else {
              orb.y += Math.sin(elapsed * 4 + orb.trailSeed) * 0.0025;
            }

            if (orb.x > 8.1) {
              passedDelta += 1;
              spawnSparkBurst(8.0, orb.y, orb.z, 0x34d399, 5);
              scene.remove(orb.mesh);
              (orb.mesh.material as THREE.Material).dispose();
              orbs.splice(i, 1);
              continue;
            }
          } else {
            // Deflected / vetoed orb falls into red containment sink
            orb.vy -= 4.4 * dt;
            orb.x += orb.vx * dt;
            orb.y += orb.vy * dt;
            orb.z += orb.vz * dt;
            orb.life -= dt * 0.9;
            orb.mesh.scale.setScalar(Math.max(0.1, orb.life));

            if (orb.y < -1.75 || orb.life <= 0) {
              scene.remove(orb.mesh);
              (orb.mesh.material as THREE.Material).dispose();
              orbs.splice(i, 1);
              continue;
            }
          }

          orb.mesh.position.set(orb.x, orb.y, orb.z);
        }

        // Update sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.vy -= 3.2 * dt;
          sp.mesh.position.x += sp.vx * dt;
          sp.mesh.position.y += sp.vy * dt;
          sp.mesh.position.z += sp.vz * dt;
          sp.life -= dt * 1.4;
          (sp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sp.life);
          if (sp.life <= 0) {
            scene.remove(sp.mesh);
            (sp.mesh.material as THREE.Material).dispose();
            sparks.splice(i, 1);
          }
        }

        countFlushTimer += dt;
        if (countFlushTimer > 0.35 && (passedDelta > 0 || vetoedDelta > 0)) {
          const p = passedDelta;
          const v = vetoedDelta;
          passedDelta = 0;
          vetoedDelta = 0;
          countFlushTimer = 0;
          setCounts((prev) => ({
            passed: prev.passed + p,
            vetoed: prev.vetoed + v,
          }));
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D gate top anchors to 2D screen positions for crisp HTML labels
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      GATES.forEach((gate, idx) => {
        const el = labelRefs.current[idx];
        if (!el) return;
        projVec.set(gate.x, 1.72, 0).project(camera);
        if (projVec.z > 1) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          return;
        }
        const sx = (projVec.x * 0.5 + 0.5) * cw;
        const sy = (-projVec.y * 0.5 + 0.5) * ch;
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
        el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
      });
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.removeEventListener("start", cancelLerp);
      controls.dispose();
      orbGeo.dispose();
      sparkGeo.dispose();
      railGeo.dispose();
      railMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      portalMatBase.dispose();
      renderer.dispose();
    };
  }, []);

  const currentGate = useMemo(() => GATES[selectedGate], [selectedGate]);

  return (
    <div className="terminal-panel overflow-hidden rounded-lg border border-border-hairline bg-surface-base/95">
      {/* Top Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-hairline bg-surface-elevated/70 px-3.5 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
            <span>Simulasi 3D Gerbang Risiko (Geser 360°)</span>
          </span>
          <span className="rounded-sm border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Ilustrasi Konseptual
          </span>
          <span className="hidden rounded-sm border border-border-hairline bg-surface-base/80 px-2 py-0.5 font-mono text-[10px] text-text-muted md:inline-block">
            Klik gerbang di 3D untuk fokus
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScenarioSwitch("risky")}
            className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] font-semibold transition-colors ${
              scenario === "risky"
                ? "border-risk/70 bg-risk/15 text-risk"
                : "border-border-hairline bg-surface-base/70 text-text-muted hover:text-text-primary"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Rencana Berisiko</span>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioSwitch("safe")}
            className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] font-semibold transition-colors ${
              scenario === "safe"
                ? "border-cleared/70 bg-cleared/15 text-cleared"
                : "border-border-hairline bg-surface-base/70 text-text-muted hover:text-text-primary"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Rencana Aman</span>
          </button>

          <button
            type="button"
            onClick={() => burstTriggerRef.current?.()}
            className="inline-flex min-h-[30px] items-center gap-1 rounded-sm border border-cleared/40 bg-cleared/10 px-2.5 font-mono text-[11px] font-semibold text-cleared transition-colors hover:bg-cleared/20"
            title="Tembakkan 10 paket uji serentak"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tembak Uji</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Jeda simulasi" : "Putar simulasi"}
            className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-sm border border-border-hairline bg-surface-base/70 text-text-secondary hover:text-text-primary"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={resetCamera}
            aria-label="Reset sudut kamera"
            title="Reset Kamera"
            className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-sm border border-border-hairline bg-surface-base/70 text-text-secondary hover:text-text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Live 3D Canvas Stage with Projected Floating Gate Badges */}
      <div
        role="img"
        aria-label="Visualisasi 3D interaktif 5 gerbang penyaringan risiko TesisLab"
        className="relative h-[300px] w-full overflow-hidden bg-[#060b11] sm:h-[360px]"
      >
        <div ref={mountRef} className="h-full w-full touch-pan-y cursor-grab active:cursor-grabbing" />

        {/* Projected 3D Gate Labels */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {GATES.map((gate, idx) => {
            const active = selectedGate === idx;
            return (
              <button
                key={gate.id}
                ref={(el) => {
                  labelRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => focusGateCamera(idx)}
                style={{ left: 0, top: 0 }}
                className={`absolute rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap backdrop-blur-md transition-shadow ${
                  gate.badgeClass
                } ${active ? "ring-2 ring-white/60 shadow-lg" : "opacity-90 hover:opacity-100"}`}
              >
                {gate.code} · {gate.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Corner Telemetry & Legend HUD */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <div className="rounded-sm border border-border-hairline bg-surface-base/80 px-2.5 py-1 font-mono text-[10px] backdrop-blur-sm">
            <span className="text-emerald-400">● Lolos: {counts.passed}</span>
            <span className="mx-2 text-text-muted">|</span>
            <span className="text-rose-400">● Diblokir Veto: {counts.vetoed}</span>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-text-muted">
          <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border-hairline bg-surface-base/75 px-2.5 py-1 backdrop-blur-sm">
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Uji Asumsi
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Ditolak Gerbang 04
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Jalur P5–P95
            </span>
          </div>

          <span className="hidden rounded-sm border border-border-hairline bg-surface-base/75 px-2.5 py-1 backdrop-blur-sm sm:inline-block">
            {scenario === "risky"
              ? "Perisai Veto 04 Aktif · Mayoritas Rencana Agresif Dipantulkan"
              : "Semua Gerbang Terbuka · Cabang Monte Carlo P5–P95 Aktif"}
          </span>
        </div>
      </div>

      {/* Bottom Gate Selector + Plain-Indonesian Explanation Bar */}
      <div className="border-t border-border-hairline bg-surface-elevated/55 px-3.5 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {GATES.map((gate, idx) => {
            const active = selectedGate === idx;
            return (
              <button
                key={gate.id}
                type="button"
                onClick={() => focusGateCamera(idx)}
                className={`rounded-sm border px-2.5 py-1 font-mono text-[10px] font-semibold transition-colors ${
                  active
                    ? `${gate.badgeClass} ring-1 ring-white/30`
                    : "border-border-hairline bg-surface-base/70 text-text-muted hover:text-text-primary"
                }`}
              >
                {gate.code} · {gate.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 flex flex-col justify-between gap-3 rounded-md border border-border-hairline bg-surface-base/70 px-3.5 py-2.5 sm:flex-row sm:items-center">
          <div className="space-y-0.5">
            <div className={`font-mono text-[11px] font-semibold ${currentGate.accentText}`}>
              {currentGate.title}
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-secondary">
              {scenario === "risky" ? currentGate.riskySummary : currentGate.safeSummary}
            </p>
          </div>

          <Link
            href="/terminal/audit"
            className="inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 self-start rounded-sm border border-cleared/40 bg-cleared/10 px-3 font-mono text-[11px] font-semibold text-cleared transition-colors hover:bg-cleared/20 sm:self-center"
          >
            <span>Uji Rencana Anda</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
