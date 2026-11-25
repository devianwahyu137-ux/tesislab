"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useTheme } from "@/context/ThemeContext";

export interface Compare3DDiffStageProps {
  curveA: number[]; // 7 stress points (0..60% shock) -> score 0..100
  curveB: number[];
}

/**
 * Interactive Three.js 3D Dual-Lane Stress Comparison Stage for `/terminal/compare`.
 * Renders Option A (emerald lane) vs Option B (sky/amber lane) resilience towers across
 * 7 shock levels so users immediately see which plan collapses first under stress.
 */
export default function Compare3DDiffStage({
  curveA,
  curveB,
}: Compare3DDiffStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const curvesRef = useRef({ curveA, curveB });

  useEffect(() => {
    curvesRef.current = { curveA, curveB };
  }, [curveA, curveB]);

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
    renderer.toneMappingExposure = theme === "light" ? 1.05 : 1.2;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 2.25, 6.4);
    camera.lookAt(0, -0.1, 0);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const root = new THREE.Group();
    scene.add(root);

    const grid = new THREE.GridHelper(
      4.4,
      10,
      theme === "light" ? 0x94a3b8 : 0x10b981,
      theme === "light" ? 0xcbd5e1 : 0x1e293b
    );
    grid.position.y = -0.9;
    root.add(grid);

    const STEPS = 7;
    const barGeo = new THREE.BoxGeometry(0.36, 1, 0.36);
    const barsA: { mesh: THREE.Mesh; mat: THREE.MeshPhysicalMaterial }[] = [];
    const barsB: { mesh: THREE.Mesh; mat: THREE.MeshPhysicalMaterial }[] = [];

    for (let i = 0; i < STEPS; i += 1) {
      const x = (i - 3) * 0.58;
      const matA = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        metalness: 0.25,
        roughness: 0.2,
        clearcoat: 0.85,
      });
      const meshA = new THREE.Mesh(barGeo, matA);
      meshA.position.set(x, -0.4, -0.58);
      root.add(meshA);
      barsA.push({ mesh: meshA, mat: matA });

      const matB = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.25,
        roughness: 0.2,
        clearcoat: 0.85,
      });
      const meshB = new THREE.Mesh(barGeo, matB);
      meshB.position.set(x, -0.4, 0.58);
      root.add(meshB);
      barsB.push({ mesh: meshB, mat: matB });
    }

    let isDragging = false;
    let prevX = 0;
    let yaw = 0.38;
    const onDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      yaw += (e.clientX - prevX) * 0.01;
      prevX = e.clientX;
    };
    const onUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.position.z = w < 520 ? 7.4 : 6.1;
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
    const emerald = new THREE.Color(0x10b981);
    const sky = new THREE.Color(0x38bdf8);
    const crimson = new THREE.Color(0xef4444);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (!isDragging) yaw += 0.0022;
      root.rotation.y += (yaw - root.rotation.y) * 0.08;

      const { curveA: cA, curveB: cB } = curvesRef.current;
      for (let i = 0; i < STEPS; i += 1) {
        const scoreA = cA[i] ?? 50;
        const scoreB = cB[i] ?? 50;
        const hA = Math.max(0.16, (scoreA / 100) * 1.75);
        const hB = Math.max(0.16, (scoreB / 100) * 1.75);

        const bA = barsA[i]!;
        bA.mesh.scale.y += (hA - bA.mesh.scale.y) * 0.12;
        bA.mesh.position.y = -0.9 + bA.mesh.scale.y / 2;
        bA.mat.color.lerp(scoreA < 50 ? crimson : emerald, 0.12);

        const bB = barsB[i]!;
        bB.mesh.scale.y += (hB - bB.mesh.scale.y) * 0.12;
        bB.mesh.position.y = -0.9 + bB.mesh.scale.y / 2;
        bB.mat.color.lerp(scoreB < 50 ? crimson : sky, 0.12);
      }

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      barGeo.dispose();
      barsA.forEach((b) => b.mat.dispose());
      barsB.forEach((b) => b.mat.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="relative h-[210px] w-full cursor-grab active:cursor-grabbing sm:h-[250px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
