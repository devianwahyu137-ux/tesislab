"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const GATES = [
  { id: 0, code: "G1", name: "ZOD SCHEMA", color: 0x38bdf8 },
  { id: 1, code: "G2", name: "DECIMAL.JS", color: 0x10b981 },
  { id: 2, code: "G3", name: "HERMES MACRO", color: 0xf59e0b },
  { id: 3, code: "G4", name: "HARD VETO", color: 0xef4444 },
  { id: 4, code: "G5", name: "MONTE CARLO", color: 0x10b981 },
] as const;

/**
 * Interactive Three.js 5-Gate Deterministic Optical Filter Lattice on `/methodology`.
 * Streams assumption particles through 5 translucent physical gates—deflecting fragile
 * assumptions at the Hard Veto gate while cleared signals emerge in emerald.
 */
export default function MethodologyGate3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [activeGate, setActiveGate] = useState<number>(1);
  const activeGateRef = useRef<number>(1);

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
    renderer.toneMappingExposure = theme === "light" ? 1.05 : 1.22;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 1.45, 7.6);
    camera.lookAt(0, 0, 0);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3, 6, 5);
    scene.add(keyLight);

    const root = new THREE.Group();
    scene.add(root);

    // Central Optical Rail
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 6.8, 16);
    railGeo.rotateZ(Math.PI / 2);
    const railMat = new THREE.MeshStandardMaterial({
      color: theme === "light" ? 0x94a3b8 : 0x334155,
      metalness: 0.8,
      roughness: 0.25,
    });
    const rail = new THREE.Mesh(railGeo, railMat);
    root.add(rail);

    // 5 Translucent Filter Gates
    const gateFrameGeo = new THREE.BoxGeometry(0.12, 1.65, 1.65);
    const gateRingGeo = new THREE.TorusGeometry(0.62, 0.03, 14, 48);
    gateRingGeo.rotateY(Math.PI / 2);

    const gateMeshes: {
      group: THREE.Group;
      mat: THREE.MeshPhysicalMaterial;
      ringMat: THREE.MeshStandardMaterial;
    }[] = [];

    GATES.forEach((g, idx) => {
      const x = (idx - 2) * 1.45;
      const grp = new THREE.Group();
      grp.position.set(x, 0, 0);

      const mat = new THREE.MeshPhysicalMaterial({
        color: g.color,
        metalness: 0.15,
        roughness: 0.15,
        transmission: 0.55,
        transparent: true,
        opacity: 0.72,
        thickness: 0.4,
      });
      const slab = new THREE.Mesh(gateFrameGeo, mat);
      grp.add(slab);

      const ringMat = new THREE.MeshStandardMaterial({
        color: g.color,
        emissive: g.color,
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(gateRingGeo, ringMat);
      grp.add(ring);

      root.add(grp);
      gateMeshes.push({ group: grp, mat, ringMat });
    });

    // 28 Streaming Assumption Particles (20 valid emerald/cyan, 8 flawed crimson deflected at Gate 4 x=1.45)
    const PARTICLE_COUNT = 28;
    const pGeo = new THREE.SphereGeometry(0.065, 12, 12);
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
        color: flawed ? 0xef4444 : 0x10b981,
        emissive: flawed ? 0xef4444 : 0x10b981,
        emissiveIntensity: 0.6,
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

      const elapsed = (now - start) * 0.001;
      root.rotation.y += (targetYaw - root.rotation.y) * 0.08;

      gateMeshes.forEach((gm, idx) => {
        const selected = idx === activeGateRef.current;
        const targetScale = selected ? 1.14 : 0.96;
        gm.group.scale.lerp(
          new THREE.Vector3(1, targetScale, targetScale),
          0.12
        );
        gm.ringMat.emissiveIntensity = selected ? 0.95 : 0.25;
      });

      for (const p of particles) {
        const u = (p.phase + elapsed * 0.18) % 1;
        const x = -3.4 + u * 6.8;
        if (p.flawed && x > 1.45) {
          // Deflected downward at Hard Veto Gate (G4 at x=1.45)
          const over = x - 1.45;
          p.mesh.position.set(1.45 - over * 0.25, p.laneY - over * 1.15, p.laneZ + over * 0.6);
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
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div className="terminal-panel bg-blueprint-grid overflow-hidden rounded-md">
      <div
        ref={containerRef}
        className="relative h-[200px] w-full cursor-grab active:cursor-grabbing sm:h-[250px] lg:h-[280px]"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-obsidian/90 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {GATES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGate(g.id)}
              className={cn(
                "rounded-xs border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                activeGate === g.id
                  ? "border-cleared/50 bg-cleared/12 text-cleared"
                  : "border-hairline bg-surface text-text-muted hover:text-text-primary"
              )}
            >
              {g.code} · {g.name}
            </button>
          ))}
        </div>

        <span className="font-mono text-[10px] text-text-muted">
          {t("methodology_page.gate_3d_hint")}
        </span>
      </div>
    </div>
  );
}
