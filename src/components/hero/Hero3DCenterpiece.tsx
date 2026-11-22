"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

type CenterpieceMode = "trading" | "business" | "cashflow";

const MODES: readonly CenterpieceMode[] = ["trading", "business", "cashflow"];

/**
 * Unboxed Interactive 3-Mode Three.js Hero Risk Monolith (alpha: true).
 * Clicking the 3D sculpture or the mode pills morphs cleanly between:
 *  - TRADING: Kinetic Candlesticks + TP/SL Laser Planes + Veto Gimbal Rings
 *  - BUSINESS: Margin/BEP Rising Blocks + Cash Runway Cylinder Gauge
 *  - CASHFLOW: Concentric 3D DSR / Expense / Reserve Torus Arcs
 */
export default function Hero3DCenterpiece() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { locale } = useTranslation();
  const { theme } = useTheme();
  const [mode, setMode] = useState<CenterpieceMode>("trading");
  const modeRef = useRef<CenterpieceMode>("trading");
  const spinBoostRef = useRef(0);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    modeRef.current = mode;
    spinBoostRef.current = 4.2;
  }, [mode]);

  const cycleMode = () => {
    setMode((prev) => {
      const idx = MODES.indexOf(prev);
      return MODES[(idx + 1) % MODES.length];
    });
  };

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
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();

    // Studio PBR Environment Reflections via built-in Three.js RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 60);
    camera.position.set(0, 1.45, 5.4);
    camera.lookAt(0, 0.15, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 0.12, 0);
    controls.update();

    // Bright Studio 3-Point Lighting
    const hemi = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.4);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4.5, 6.5, 5);
    scene.add(key);

    const emeraldRim = new THREE.PointLight(0x10b981, 2.4, 10);
    emeraldRim.position.set(-3.2, 1.5, 2.4);
    scene.add(emeraldRim);

    const goldRim = new THREE.PointLight(0xf59e0b, 1.9, 10);
    goldRim.position.set(3.2, 1.8, 2.2);
    scene.add(goldRim);

    const sculpture = new THREE.Group();
    scene.add(sculpture);

    // Shared Studio PBR Physical Materials (glassy clearcoat + metallic specular)
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0x16202e,
      roughness: 0.24,
      metalness: 0.65,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.35,
    });
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.9,
      envMapIntensity: 1.5,
    });
    const emeraldMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.16,
      metalness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.45,
    });
    const coralMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.4,
    });
    const cyanMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    });

    // Subtle Floating Glowing 3D Data Particles
    const particleCount = 64;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.55 + (i % 5) * 0.34;
      pPositions[i * 3] = Math.cos(angle) * radius;
      pPositions[i * 3 + 1] = ((i % 7) - 3) * 0.28;
      pPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.068,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dataParticles = new THREE.Points(particleGeo, particleMat);
    sculpture.add(dataParticles);

    // Floating Pedestal Slab + Base Ring
    const slab = new THREE.Mesh(
      new RoundedBoxGeometry(2.7, 0.18, 1.48, 3, 0.04),
      slabMat
    );
    slab.position.y = -0.6;
    sculpture.add(slab);

    const baseTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.024, 12, 64),
      goldMat
    );
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = -0.6;
    sculpture.add(baseTrim);

    // ── MODE 1: TRADING CANDLESTICKS + TP/SL PLANES ─────────────────────────
    const tradingGroup = new THREE.Group();
    const candleSpecs = [
      { x: -0.92, h: 0.62, bull: false, phase: 0.0 },
      { x: -0.46, h: 0.92, bull: true, phase: 0.9 },
      { x: 0.0, h: 1.24, bull: true, phase: 1.8 },
      { x: 0.46, h: 0.78, bull: false, phase: 2.7 },
      { x: 0.92, h: 1.05, bull: true, phase: 3.6 },
    ];
    const candleMeshes: { body: THREE.Mesh; baseH: number; phase: number }[] = [];
    candleSpecs.forEach((spec) => {
      const body = new THREE.Mesh(
        new RoundedBoxGeometry(0.26, spec.h, 0.26, 2, 0.03),
        spec.bull ? emeraldMat : coralMat
      );
      body.position.set(spec.x, -0.48 + spec.h / 2, 0);
      tradingGroup.add(body);

      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, spec.h + 0.36, 8),
        goldMat
      );
      wick.position.set(spec.x, -0.48 + spec.h / 2, 0);
      tradingGroup.add(wick);

      candleMeshes.push({ body, baseH: spec.h, phase: spec.phase });
    });

    // Subtle TP & SL target rails
    const tpRail = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.02, 0.02),
      emeraldMat
    );
    tpRail.position.set(0, 0.86, 0.24);
    tradingGroup.add(tpRail);

    const slRail = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.02, 0.02),
      coralMat
    );
    slRail.position.set(0, -0.22, 0.24);
    tradingGroup.add(slRail);
    sculpture.add(tradingGroup);

    // ── MODE 2: BUSINESS BEP & RUNWAY GAUGE ─────────────────────────────────
    const businessGroup = new THREE.Group();
    const bizBars = [
      { x: -0.82, h: 0.48, mat: coralMat },
      { x: -0.28, h: 0.78, mat: goldMat },
      { x: 0.26, h: 1.12, mat: emeraldMat },
      { x: 0.82, h: 1.38, mat: cyanMat },
    ];
    bizBars.forEach((b) => {
      const col = new THREE.Mesh(
        new RoundedBoxGeometry(0.36, b.h, 0.36, 3, 0.04),
        b.mat
      );
      col.position.set(b.x, -0.48 + b.h / 2, 0);
      businessGroup.add(col);
    });
    const bepLine = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.025, 10, 48),
      goldMat
    );
    bepLine.rotation.x = Math.PI / 2;
    bepLine.position.y = 0.22;
    businessGroup.add(bepLine);
    businessGroup.scale.setScalar(0.001);
    sculpture.add(businessGroup);

    // ── MODE 3: CASHFLOW DSR CONCENTRIC RINGS ───────────────────────────────
    const cashflowGroup = new THREE.Group();
    const dsrOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.085, 16, 48, Math.PI * 1.45),
      emeraldMat
    );
    dsrOuter.position.y = 0.28;
    cashflowGroup.add(dsrOuter);

    const dsrMid = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.075, 16, 44, Math.PI * 1.1),
      goldMat
    );
    dsrMid.position.y = 0.28;
    dsrMid.rotation.z = 1.2;
    cashflowGroup.add(dsrMid);

    const dsrCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      cyanMat
    );
    dsrCore.position.y = 0.28;
    cashflowGroup.add(dsrCore);
    cashflowGroup.scale.setScalar(0.001);
    sculpture.add(cashflowGroup);

    // Orbiting Gimbal Rings
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.022, 12, 72),
      goldMat
    );
    outerRing.position.y = 0.2;
    outerRing.rotation.x = Math.PI / 2.6;
    sculpture.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.44, 0.018, 12, 64),
      cyanMat
    );
    innerRing.position.y = 0.25;
    innerRing.rotation.x = -Math.PI / 3;
    innerRing.rotation.y = Math.PI / 5;
    sculpture.add(innerRing);

    // Floating Satellite Geometric Nodes
    const satellites: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number }[] = [
      {
        mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), emeraldMat),
        basePos: new THREE.Vector3(-2.15, 0.45, 0.2),
        speed: 1.4,
      },
      {
        mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), goldMat),
        basePos: new THREE.Vector3(2.15, 0.65, -0.15),
        speed: 1.7,
      },
      {
        mesh: new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), cyanMat),
        basePos: new THREE.Vector3(1.85, -0.35, 0.55),
        speed: 1.2,
      },
    ];
    satellites.forEach((s) => {
      s.mesh.position.copy(s.basePos);
      sculpture.add(s.mesh);
    });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.position.z = w < 520 ? 5.6 : 4.35;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    let pointerY = 0;
    const onWindowPointerMove = (e: PointerEvent) => {
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      pointerY = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener("pointermove", onWindowPointerMove, { passive: true });

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

      const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
      const elapsed = Math.max(0, (now - startTime) / 1000);

      slabMat.color.setHex(themeRef.current === "light" ? 0x1e293b : 0x151c26);

      if (spinBoostRef.current > 0.01) {
        spinBoostRef.current *= 0.93;
      } else {
        spinBoostRef.current = 0;
      }

      // Smooth morph scaling between the 3 3D modes
      const activeM = modeRef.current;
      const tScale = activeM === "trading" ? 1 : 0.001;
      const bScale = activeM === "business" ? 1 : 0.001;
      const cScale = activeM === "cashflow" ? 1 : 0.001;
      const lerpAmt = reducedMotion ? 1 : 0.12;

      tradingGroup.scale.setScalar(
        THREE.MathUtils.lerp(tradingGroup.scale.x, tScale, lerpAmt)
      );
      businessGroup.scale.setScalar(
        THREE.MathUtils.lerp(businessGroup.scale.x, bScale, lerpAmt)
      );
      cashflowGroup.scale.setScalar(
        THREE.MathUtils.lerp(cashflowGroup.scale.x, cScale, lerpAmt)
      );

      if (!reducedMotion) {
        const boost = spinBoostRef.current;
        sculpture.position.y = Math.sin(elapsed * 1.55) * 0.085;
        sculpture.rotation.x += (pointerY * 0.14 - sculpture.rotation.x) * 0.06;

        outerRing.rotation.z += dt * (0.62 + boost);
        outerRing.rotation.x = Math.PI / 2.6 + Math.sin(elapsed * 0.8) * 0.14;
        innerRing.rotation.z -= dt * (0.88 + boost * 1.25);

        candleMeshes.forEach((c) => {
          const pulse =
            0.72 + 0.36 * (0.5 + 0.5 * Math.sin(elapsed * 2.4 + c.phase));
          c.body.scale.y = pulse;
          c.body.position.y = -0.48 + (c.baseH * pulse) / 2;
        });

        dsrOuter.rotation.z += dt * 0.55;
        dsrMid.rotation.z -= dt * 0.85;
        dsrCore.rotation.y += dt * 1.2;
        dataParticles.rotation.y += dt * (0.28 + boost * 0.25);

        satellites.forEach((s, i) => {
          s.mesh.rotation.y += dt * (s.speed + boost * 0.5);
          s.mesh.rotation.x += dt * (s.speed * 0.7);
          s.mesh.position.y =
            s.basePos.y + Math.sin(elapsed * 2.1 + i * 2.1) * 0.14;
        });
      }

      controls.update();
      renderer.render(scene, camera);
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
      { rootMargin: "120px" }
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
      ro.disconnect();
      controls.dispose();
      window.removeEventListener("pointermove", onWindowPointerMove);

      envRT.dispose();
      pmremGenerator.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
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

  const calloutMap: Record<CenterpieceMode, { id: string; en: string }> = {
    trading: {
      id: "Mode Trading · Cek R:R ≥ 1.5 & SL vs ATR-14",
      en: "Trading Mode · Verify R:R ≥ 1.5 & SL vs ATR-14",
    },
    business: {
      id: "Mode UMKM · Uji BEP & Runway ≥ 6 Bulan",
      en: "SME Mode · Stress-Test BEP & Runway ≥ 6 Mo",
    },
    cashflow: {
      id: "Mode Cashflow · Kunci DSR ≤ 30% & Dana Darurat",
      en: "Cashflow Mode · Cap DSR ≤ 30% & Reserve",
    },
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center">
      {/* Dual-Layer Volumetric Luminous Halo behind 3D Monolith */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 blur-3xl [[data-theme=light]_&]:opacity-45"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.36) 0%, rgba(56, 189, 248, 0.2) 48%, transparent 76%)",
        }}
      />

      <div
        ref={containerRef}
        onClick={cycleMode}
        className="relative z-10 h-[250px] w-full cursor-pointer sm:h-[305px] lg:h-[340px]"
        title={
          locale === "id"
            ? "Klik objek 3D untuk ganti mode simulasi · Geser untuk putar 360°"
            : "Click 3D monolith to switch mode · Drag to rotate 360°"
        }
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* Interactive Mode Switcher + Legible Micro-Callout */}
      <div className="relative z-10 mt-1.5 flex flex-wrap items-center justify-center gap-2">
        {MODES.map((m) => {
          const isActive = mode === m;
          const label =
            m === "trading" ? "Trading" : m === "business" ? "UMKM / BEP" : "Cashflow";
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md border px-2.5 py-1 font-sans text-[11px] font-semibold transition-all",
                isActive
                  ? "glow-emerald border-cleared/60 bg-cleared/15 text-cleared"
                  : "border-hairline bg-surface/90 text-text-secondary hover:border-active-border hover:text-text-primary"
              )}
            >
              {label}
            </button>
          );
        })}
        <span className="hidden font-sans text-xs text-text-secondary sm:inline">
          · {locale === "id" ? calloutMap[mode].id : calloutMap[mode].en}
        </span>
      </div>
    </div>
  );
}
