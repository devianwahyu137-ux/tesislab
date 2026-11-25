"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTheme } from "@/context/ThemeContext";

export interface Compare3DDiffStageProps {
  curveA: number[]; // 7 stress points (0..60% shock) -> score 0..100
  curveB: number[];
  activeShockPct?: number;
}

/**
 * Interactive Three.js 3D Dual-Lane Stress Comparison Stage for `/terminal/compare`.
 * Renders vivid, non-washed-out beveled pillars for Option A vs Option B across 7 shock
 * levels (0%..60%), a glowing danger-zone plane at Score 50, and an active shock marker.
 */
export default function Compare3DDiffStage({
  curveA,
  curveB,
  activeShockPct = 20,
}: Compare3DDiffStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const curvesRef = useRef({ curveA, curveB, activeShockPct });
  const resetYawRef = useRef(false);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  useEffect(() => {
    curvesRef.current = { curveA, curveB, activeShockPct };
  }, [curveA, curveB, activeShockPct]);

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
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 2.35, 6.2);
    camera.lookAt(0, -0.05, 0);

    // Rich directional + colored rim lighting (NO bright white RoomEnvironment wash-out!)
    const hemi = new THREE.HemisphereLight(
      theme === "light" ? 0xffffff : 0x94a3b8,
      theme === "light" ? 0xcbd5e1 : 0x0f172a,
      theme === "light" ? 1.25 : 0.95
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    // Architectural dark stage base + crisp grid
    const basePlate = new THREE.Mesh(
      new RoundedBoxGeometry(4.7, 0.08, 2.5, 2, 0.02),
      new THREE.MeshStandardMaterial({
        color: theme === "light" ? 0xe2e8f0 : 0x0b1322,
        roughness: 0.7,
        metalness: 0.15,
      })
    );
    basePlate.position.y = -0.95;
    root.add(basePlate);

    const grid = new THREE.GridHelper(
      4.5,
      10,
      theme === "light" ? 0x64748b : 0x10b981,
      theme === "light" ? 0xcbd5e1 : 0x1e293b
    );
    grid.position.y = -0.905;
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.35;
      });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
    }
    root.add(grid);

    // Glowing Score = 50 Danger Threshold Plane
    const thresholdGeo = new THREE.PlaneGeometry(4.35, 2.05);
    const thresholdMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const thresholdPlane = new THREE.Mesh(thresholdGeo, thresholdMat);
    thresholdPlane.rotation.x = -Math.PI / 2;
    thresholdPlane.position.y = -0.9 + 0.5 * 1.85;
    root.add(thresholdPlane);

    const thresholdBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(thresholdGeo),
      new THREE.LineBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.45,
      })
    );
    thresholdBorder.rotation.x = -Math.PI / 2;
    thresholdBorder.position.y = thresholdPlane.position.y;
    root.add(thresholdBorder);

    // Active Shock Highlight Frame sliding on the floor
    const shockHighlight = new THREE.Mesh(
      new RoundedBoxGeometry(0.48, 0.03, 1.95, 2, 0.01),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.35,
      })
    );
    shockHighlight.position.set(0, -0.895, 0);
    root.add(shockHighlight);

    const STEPS = 7;
    const barGeo = new RoundedBoxGeometry(0.36, 1, 0.36, 3, 0.045);
    const barsA: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];
    const barsB: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];

    for (let i = 0; i < STEPS; i += 1) {
      const x = (i - 3) * 0.58;
      const matA = new THREE.MeshStandardMaterial({
        color: 0x059669,
        emissive: 0x10b981,
        emissiveIntensity: 0.36,
        metalness: 0.22,
        roughness: 0.28,
      });
      const meshA = new THREE.Mesh(barGeo, matA);
      meshA.position.set(x, -0.4, -0.56);
      meshA.userData = { side: "A", stepIdx: i };
      root.add(meshA);
      barsA.push({ mesh: meshA, mat: matA });

      const matB = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.36,
        metalness: 0.22,
        roughness: 0.28,
      });
      const meshB = new THREE.Mesh(barGeo, matB);
      meshB.position.set(x, -0.4, 0.56);
      meshB.userData = { side: "B", stepIdx: i };
      root.add(meshB);
      barsB.push({ mesh: meshB, mat: matB });
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const allBars = [...barsA.map((b) => b.mesh), ...barsB.map((b) => b.mesh)];

    let isDragging = false;
    let prevX = 0;
    let yaw = 0.42;
    const onDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (isDragging) {
        yaw += (e.clientX - prevX) * 0.01;
        prevX = e.clientX;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(allBars, false);
      if (hits.length > 0) {
        const { side, stepIdx } = hits[0]!.object.userData as {
          side: "A" | "B";
          stepIdx: number;
        };
        const sc =
          side === "A"
            ? (curvesRef.current.curveA[stepIdx] ?? 0)
            : (curvesRef.current.curveB[stepIdx] ?? 0);
        setHoveredInfo(
          `Skenario ${side} · Guncangan ${stepIdx * 10}% → Skor ${sc}/100`
        );
      } else {
        setHoveredInfo(null);
      }
    };
    const onUp = () => {
      isDragging = false;
    };
    const onLeave = () => {
      setHoveredInfo(null);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp, { passive: true });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.position.z = w < 440 ? 7.1 : 5.75;
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
    const emeraldBase = new THREE.Color(0x059669);
    const emeraldGlow = new THREE.Color(0x10b981);
    const skyBase = new THREE.Color(0x0284c7);
    const skyGlow = new THREE.Color(0x38bdf8);
    const amberBase = new THREE.Color(0xd97706);
    const amberGlow = new THREE.Color(0xf59e0b);
    const crimsonBase = new THREE.Color(0xdc2626);
    const crimsonGlow = new THREE.Color(0xef4444);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (resetYawRef.current) {
        yaw = 0.42;
        resetYawRef.current = false;
      } else if (!isDragging) {
        yaw += 0.0018;
      }
      root.rotation.y += (yaw - root.rotation.y) * 0.08;

      const { curveA: cA, curveB: cB, activeShockPct: activeShock } =
        curvesRef.current;
      const activeIdx = Math.max(
        0,
        Math.min(STEPS - 1, Math.round(activeShock / 10))
      );
      const targetHighlightX = (activeIdx - 3) * 0.58;
      shockHighlight.position.x +=
        (targetHighlightX - shockHighlight.position.x) * 0.14;

      for (let i = 0; i < STEPS; i += 1) {
        const isCurrent = i === activeIdx;
        const scoreA = cA[i] ?? 50;
        const scoreB = cB[i] ?? 50;
        const hA = Math.max(0.18, (scoreA / 100) * 1.85);
        const hB = Math.max(0.18, (scoreB / 100) * 1.85);

        const bA = barsA[i]!;
        bA.mesh.scale.y += (hA - bA.mesh.scale.y) * 0.12;
        bA.mesh.position.y = -0.9 + bA.mesh.scale.y / 2;
        const colA =
          scoreA < 50 ? crimsonBase : scoreA < 65 ? amberBase : emeraldBase;
        const emA =
          scoreA < 50 ? crimsonGlow : scoreA < 65 ? amberGlow : emeraldGlow;
        bA.mat.color.lerp(colA, 0.14);
        bA.mat.emissive.lerp(emA, 0.14);
        bA.mat.emissiveIntensity = isCurrent ? 0.62 : 0.3;

        const bB = barsB[i]!;
        bB.mesh.scale.y += (hB - bB.mesh.scale.y) * 0.12;
        bB.mesh.position.y = -0.9 + bB.mesh.scale.y / 2;
        const colB =
          scoreB < 50 ? crimsonBase : scoreB < 65 ? amberBase : skyBase;
        const emB =
          scoreB < 50 ? crimsonGlow : scoreB < 65 ? amberGlow : skyGlow;
        bB.mat.color.lerp(colB, 0.14);
        bB.mat.emissive.lerp(emB, 0.14);
        bB.mat.emissiveIntensity = isCurrent ? 0.62 : 0.3;
      }

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      barGeo.dispose();
      thresholdGeo.dispose();
      thresholdMat.dispose();
      barsA.forEach((b) => b.mat.dispose());
      barsB.forEach((b) => b.mat.dispose());
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="relative h-[260px] w-full cursor-grab active:cursor-grabbing sm:h-[310px] xl:h-[340px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Live Hover Pill + Reset View Control */}
      <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
        <span className="rounded-md border border-hairline bg-obsidian/88 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-text-secondary backdrop-blur-md">
          {hoveredInfo ?? `Sorot batang 3D · Aktif: ${activeShockPct}%`}
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

      {/* Color Legend Strip at Bottom */}
      <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-emerald-500" />
          <span>A Aman</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-sky-500" />
          <span>B Aman</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-amber-500" />
          <span>Waspada (50–64)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-red-500" />
          <span>Patah (&lt;50)</span>
        </span>
      </div>
    </div>
  );
}
