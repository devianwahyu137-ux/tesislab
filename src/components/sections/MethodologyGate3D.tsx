"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const GATES = [
  {
    id: 0,
    code: "G1",
    name: "ZOD SCHEMA",
    color: 0x38bdf8,
    descId:
      "Gerbang Validasi Input: memblokir angka negatif, harga nol, atau format rusak sebelum masuk ke mesin hitung.",
    descEn:
      "Input Schema Gate: blocks negative numbers, zero prices, or malformed payloads before calculation.",
  },
  {
    id: 1,
    code: "G2",
    name: "DECIMAL.JS",
    color: 0x10b981,
    descId:
      "Mesin Aritmetika Eksak: menghitung R:R bersih, Lot BEI, BEP UMKM, dan Bunga Efektif (APR) presisi tanpa error floating-point.",
    descEn:
      "Exact Arithmetic Engine: computes Net R:R, IDX lots, SME BEP, and True APR with zero floating-point drift.",
  },
  {
    id: 2,
    code: "G3",
    name: "HERMES MACRO",
    color: 0xf59e0b,
    descId:
      "Radar Konteks Pasar Harian: menyuntikkan rezim IHSG, kurs USD/IDR, emas, dan volatilitas ATR-14 terkini.",
    descEn:
      "Daily Macro Context Gate: injects live IDX regime, USD/IDR, gold, and ATR-14 volatility thresholds.",
  },
  {
    id: 3,
    code: "G4",
    name: "HARD VETO",
    color: 0xef4444,
    descId:
      "Gerbang Penolakan Keras: partikel merah (rencana berisiko > 3% atau DSR > 30%) otomatis dibelokkan & ditolak di sini.",
    descEn:
      "Hard Veto Gate: red flawed assumptions (> 3% risk or > 30% DSR) are deflected and blocked deterministically here.",
  },
  {
    id: 4,
    code: "G5",
    name: "MONTE CARLO",
    color: 0x10b981,
    descId:
      "Uji Ketahanan 1.000 Skenario: hanya rencana yang lolos yang disimulasikan ke 1.000 jalur acak untuk mengukur risiko bangkrut (P5).",
    descEn:
      "1,000-Path Stress Test: surviving plans undergo 1,000 randomized paths to quantify P5 tail-risk ruin.",
  },
] as const;

/**
 * Interactive Three.js 5-Gate Deterministic Optical Filter Lattice on `/methodology`.
 * Streams assumption particles through 5 rich jewel-toned gates—deflecting fragile
 * assumptions at the Hard Veto gate while cleared signals emerge in emerald.
 */
export default function MethodologyGate3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const isId = locale === "id";
  const [activeGate, setActiveGate] = useState<number>(1);
  const activeGateRef = useRef<number>(1);
  const resetYawRef = useRef(false);

  useEffect(() => {
    activeGateRef.current = activeGate;
  }, [activeGate]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 1.45, 7.6);
    camera.lookAt(0, 0, 0);

    // Rich directional + rim lighting (no white RoomEnvironment wash-out!)
    const hemi = new THREE.HemisphereLight(
      theme === "light" ? 0xffffff : 0x64748b,
      theme === "light" ? 0xcbd5e1 : 0x090d16,
      theme === "light" ? 1.15 : 0.7
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(3, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 0.75);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    // Central Optical Rail
    const railGeo = new THREE.CylinderGeometry(0.028, 0.028, 6.8, 16);
    railGeo.rotateZ(Math.PI / 2);
    const railMat = new THREE.MeshStandardMaterial({
      color: theme === "light" ? 0x64748b : 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });
    const rail = new THREE.Mesh(railGeo, railMat);
    root.add(rail);

    // 5 Vivid Translucent Filter Gates
    const gateFrameGeo = new THREE.BoxGeometry(0.11, 1.65, 1.65);
    const gateRingGeo = new THREE.TorusGeometry(0.62, 0.036, 16, 48);
    gateRingGeo.rotateY(Math.PI / 2);

    const gateMeshes: {
      group: THREE.Group;
      mat: THREE.MeshStandardMaterial;
      ringMat: THREE.MeshStandardMaterial;
    }[] = [];

    GATES.forEach((g, idx) => {
      const x = (idx - 2) * 1.45;
      const grp = new THREE.Group();
      grp.position.set(x, 0, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: g.color,
        emissive: g.color,
        emissiveIntensity: 0.18,
        metalness: 0.25,
        roughness: 0.25,
        transparent: true,
        opacity: 0.34,
      });
      const slab = new THREE.Mesh(gateFrameGeo, mat);
      grp.add(slab);

      const ringMat = new THREE.MeshStandardMaterial({
        color: g.color,
        emissive: g.color,
        emissiveIntensity: 0.55,
        metalness: 0.35,
        roughness: 0.25,
      });
      const ring = new THREE.Mesh(gateRingGeo, ringMat);
      grp.add(ring);

      root.add(grp);
      gateMeshes.push({ group: grp, mat, ringMat });
    });

    // 28 Streaming Assumption Particles (20 valid emerald, 8 flawed crimson deflected at Gate 4 x=1.45)
    const PARTICLE_COUNT = 28;
    const pGeo = new THREE.SphereGeometry(0.068, 12, 12);
    const particles: {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      phase: number;
      laneY: number;
      laneZ: number;
      flawed: boolean;
    }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const flawed = i % 4 === 0;
      const mat = new THREE.MeshStandardMaterial({
        color: flawed ? 0xdc2626 : 0x059669,
        emissive: flawed ? 0xef4444 : 0x10b981,
        emissiveIntensity: 0.72,
      });
      const mesh = new THREE.Mesh(pGeo, mat);
      root.add(mesh);
      particles.push({
        mesh,
        mat,
        phase: i / PARTICLE_COUNT,
        laneY: ((i % 5) - 2) * 0.18,
        laneZ: (((i * 3) % 5) - 2) * 0.18,
        flawed,
      });
    }

    let isDragging = false;
    let prevX = 0;
    let targetYaw = -0.18;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      prevX = e.clientX;
      targetYaw = Math.max(-0.85, Math.min(0.85, targetYaw + dx * 0.008));
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.position.z = w < 640 ? 9.6 : 7.4;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let isVisible = true;
    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (resetYawRef.current) {
        targetYaw = -0.18;
        resetYawRef.current = false;
      }

      const elapsed = (now - start) * 0.001;
      root.rotation.y += (targetYaw - root.rotation.y) * 0.08;

      gateMeshes.forEach((gm, idx) => {
        const selected = idx === activeGateRef.current;
        const targetScale = selected ? 1.16 : 0.95;
        gm.group.scale.lerp(
          new THREE.Vector3(1, targetScale, targetScale),
          0.12
        );
        gm.ringMat.emissiveIntensity = selected ? 0.95 : 0.3;
        gm.mat.opacity = selected ? 0.48 : 0.24;
      });

      for (const p of particles) {
        const u = (p.phase + elapsed * 0.18) % 1;
        const x = -3.4 + u * 6.8;
        if (p.flawed && x > 1.45) {
          const over = x - 1.45;
          p.mesh.position.set(
            1.45 - over * 0.25,
            p.laneY - over * 1.15,
            p.laneZ + over * 0.6
          );
          p.mesh.scale.setScalar(Math.max(0.01, 1 - over * 0.55));
        } else {
          p.mesh.position.set(x, p.laneY, p.laneZ);
          p.mesh.scale.setScalar(1);
        }
      }

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      railGeo.dispose();
      railMat.dispose();
      gateFrameGeo.dispose();
      gateRingGeo.dispose();
      pGeo.dispose();
      gateMeshes.forEach((g) => {
        g.mat.dispose();
        g.ringMat.dispose();
      });
      particles.forEach((p) => p.mat.dispose());
      renderer.dispose();
    };
  }, [theme]);

  const currentGate = GATES[activeGate] ?? GATES[1];

  return (
    <div className="terminal-panel bg-blueprint-grid overflow-hidden rounded-lg">
      <div
        ref={containerRef}
        className="relative h-[220px] w-full cursor-grab active:cursor-grabbing sm:h-[260px] lg:h-[290px]"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
          <span className="rounded-md border border-hairline bg-obsidian/88 px-2.5 py-1 font-mono text-[10px] font-semibold text-text-secondary backdrop-blur-md">
            {isId
              ? "Hijau = Lolos · Merah = Ditolak di G4 (Hard Veto)"
              : "Green = Cleared · Red = Blocked at G4 (Hard Veto)"}
          </span>

          <button
            type="button"
            onClick={() => {
              resetYawRef.current = true;
            }}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-hairline bg-obsidian/88 px-2 py-1 font-mono text-[10px] font-semibold text-text-secondary backdrop-blur-md transition-colors hover:border-cleared/50 hover:text-cleared"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Interactive Gate Selector + Live Explanation Strip */}
      <div className="flex flex-col gap-2.5 border-t border-hairline bg-obsidian/92 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
            {GATES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGate(g.id)}
                className={cn(
                  "shrink-0 rounded-md border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                  activeGate === g.id
                    ? "border-cleared/60 bg-cleared/16 text-cleared"
                    : "border-hairline bg-surface text-text-muted hover:text-text-primary"
                )}
              >
                {g.code} · {g.name}
              </button>
            ))}
          </div>

          <span className="hidden font-mono text-[10px] text-text-muted sm:inline">
            {t("methodology_page.gate_3d_hint")}
          </span>
        </div>

        <p className="border-t border-hairline/70 pt-2 font-sans text-xs leading-relaxed text-text-secondary sm:text-[13px]">
          <strong className="mr-1.5 font-mono text-cleared">
            [{currentGate.code} · {currentGate.name}]
          </strong>
          {isId ? currentGate.descId : currentGate.descEn}
        </p>
      </div>
    </div>
  );
}
