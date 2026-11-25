"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useTheme } from "@/context/ThemeContext";

export interface Portfolio3DSurfaceProps {
  matrix: number[][];
}

/**
 * Interactive Three.js 3D Correlation Elevation Matrix for `/terminal/portfolio`.
 * Renders an N x N PBR 3D tower grid where height and color reflect pairwise
 * asset return correlations (crimson for concentrated >= 0.68 off-diagonal pairs).
 */
export default function Portfolio3DSurface({
  matrix,
}: Portfolio3DSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const matrixRef = useRef(matrix);

  useEffect(() => {
    matrixRef.current = matrix;
  }, [matrix]);

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

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 2.75, 5.8);
    camera.lookAt(0, -0.15, 0);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const root = new THREE.Group();
    scene.add(root);

    const grid = new THREE.GridHelper(
      3.8,
      8,
      theme === "light" ? 0x94a3b8 : 0x10b981,
      theme === "light" ? 0xcbd5e1 : 0x1e293b
    );
    grid.position.y = -0.85;
    root.add(grid);

    const MAX_N = 6;
    const cellGeo = new THREE.BoxGeometry(0.42, 1, 0.42);
    const cells: {
      row: number;
      col: number;
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
    }[] = [];

    for (let r = 0; r < MAX_N; r += 1) {
      for (let c = 0; c < MAX_N; c += 1) {
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0x10b981,
          metalness: 0.25,
          roughness: 0.2,
          clearcoat: 0.85,
        });
        const mesh = new THREE.Mesh(cellGeo, mat);
        root.add(mesh);
        cells.push({ row: r, col: c, mesh, mat });
      }
    }

    let isDragging = false;
    let prevX = 0;
    let yaw = 0.52;
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
      camera.position.z = w < 500 ? 6.8 : 5.7;
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

    const emerald = new THREE.Color(0x10b981);
    const crimson = new THREE.Color(0xef4444);
    const sky = new THREE.Color(0x38bdf8);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (!isDragging) yaw += 0.0025;
      root.rotation.y += (yaw - root.rotation.y) * 0.08;

      const m = matrixRef.current;
      const n = Math.min(MAX_N, m.length || 1);
      const spacing = n <= 4 ? 0.72 : 0.56;

      for (const cell of cells) {
        if (cell.row >= n || cell.col >= n) {
          cell.mesh.visible = false;
          continue;
        }
        cell.mesh.visible = true;
        const corr = m[cell.row]?.[cell.col] ?? 0;
        const isDiag = cell.row === cell.col;
        const normH = Math.max(0.18, ((corr + 1) / 2) * 1.55);
        cell.mesh.position.x = (cell.col - (n - 1) / 2) * spacing;
        cell.mesh.position.z = (cell.row - (n - 1) / 2) * spacing;
        cell.mesh.scale.y += (normH - cell.mesh.scale.y) * 0.12;
        cell.mesh.position.y = -0.85 + cell.mesh.scale.y / 2;

        const targetColor = isDiag
          ? sky
          : corr >= 0.68
            ? crimson
            : emerald;
        cell.mat.color.lerp(targetColor, 0.14);
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
      cellGeo.dispose();
      cells.forEach((c) => c.mat.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="relative h-[220px] w-full cursor-grab active:cursor-grabbing sm:h-[260px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
