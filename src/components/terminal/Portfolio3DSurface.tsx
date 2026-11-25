"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTheme } from "@/context/ThemeContext";

export interface Portfolio3DSurfaceProps {
  matrix: number[][];
  symbols?: string[];
}

/**
 * Interactive Three.js 3D Correlation Elevation Matrix for `/terminal/portfolio`.
 * Renders an N x N beveled crystal tower grid with vivid saturated colors,
 * hover pair-inspection raycasting, and a clean architectural stage base.
 */
export default function Portfolio3DSurface({
  matrix,
  symbols = [],
}: Portfolio3DSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const dataRef = useRef({ matrix, symbols });
  const resetYawRef = useRef(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    dataRef.current = { matrix, symbols };
  }, [matrix, symbols]);

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
    renderer.toneMappingExposure = 0.98;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 2.75, 5.75);
    camera.lookAt(0, -0.1, 0);

    // Rich directional + rim lighting (no white RoomEnvironment wash-out!)
    const hemi = new THREE.HemisphereLight(
      theme === "light" ? 0xffffff : 0x64748b,
      theme === "light" ? 0xcbd5e1 : 0x090d16,
      theme === "light" ? 1.1 : 0.65
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    const basePlate = new THREE.Mesh(
      new RoundedBoxGeometry(4.1, 0.08, 4.1, 2, 0.02),
      new THREE.MeshStandardMaterial({
        color: theme === "light" ? 0xe2e8f0 : 0x0b1322,
        roughness: 0.7,
        metalness: 0.15,
      })
    );
    basePlate.position.y = -0.9;
    root.add(basePlate);

    const grid = new THREE.GridHelper(
      3.9,
      8,
      theme === "light" ? 0x64748b : 0x10b981,
      theme === "light" ? 0xcbd5e1 : 0x1e293b
    );
    grid.position.y = -0.855;
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

    const MAX_N = 6;
    const cellGeo = new RoundedBoxGeometry(0.42, 1, 0.42, 3, 0.045);
    const cells: {
      row: number;
      col: number;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
    }[] = [];

    for (let r = 0; r < MAX_N; r += 1) {
      for (let c = 0; c < MAX_N; c += 1) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x047857,
          emissive: 0x10b981,
          emissiveIntensity: 0.45,
          metalness: 0.2,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(cellGeo, mat);
        mesh.userData = { row: r, col: c };
        root.add(mesh);
        cells.push({ row: r, col: c, mesh, mat });
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const cellMeshes = cells.map((c) => c.mesh);

    let isDragging = false;
    let prevX = 0;
    let yaw = 0.52;
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
      const hits = raycaster.intersectObjects(cellMeshes, false);
      if (hits.length > 0) {
        const { row, col } = hits[0]!.object.userData as {
          row: number;
          col: number;
        };
        const { matrix: m, symbols: syms } = dataRef.current;
        const corr = m[row]?.[col];
        if (typeof corr === "number") {
          const sA = (syms[row] ?? `#${row + 1}`).replace(".JK", "");
          const sB = (syms[col] ?? `#${col + 1}`).replace(".JK", "");
          setHoveredCell(
            `${sA} ↔ ${sB}: ρ = ${corr >= 0 ? "+" : ""}${corr.toFixed(2)}`
          );
        }
      } else {
        setHoveredCell(null);
      }
    };
    const onUp = () => {
      isDragging = false;
    };
    const onLeave = () => {
      setHoveredCell(null);
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
      camera.position.z = w < 500 ? 6.8 : 5.65;
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

    const emeraldBase = new THREE.Color(0x059669);
    const emeraldGlow = new THREE.Color(0x10b981);
    const amberBase = new THREE.Color(0xd97706);
    const amberGlow = new THREE.Color(0xf59e0b);
    const crimsonBase = new THREE.Color(0xdc2626);
    const crimsonGlow = new THREE.Color(0xef4444);
    const skyBase = new THREE.Color(0x0284c7);
    const skyGlow = new THREE.Color(0x38bdf8);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (resetYawRef.current) {
        yaw = 0.52;
        resetYawRef.current = false;
      } else if (!isDragging) {
        yaw += 0.0022;
      }
      root.rotation.y += (yaw - root.rotation.y) * 0.08;

      const m = dataRef.current.matrix;
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
        const normH = Math.max(0.2, ((corr + 1) / 2) * 1.65);
        cell.mesh.position.x = (cell.col - (n - 1) / 2) * spacing;
        cell.mesh.position.z = (cell.row - (n - 1) / 2) * spacing;
        cell.mesh.scale.y += (normH - cell.mesh.scale.y) * 0.12;
        cell.mesh.position.y = -0.85 + cell.mesh.scale.y / 2;

        const targetBase = isDiag
          ? skyBase
          : corr >= 0.68
            ? crimsonBase
            : corr >= 0.35
              ? amberBase
              : emeraldBase;
        const targetGlow = isDiag
          ? skyGlow
          : corr >= 0.68
            ? crimsonGlow
            : corr >= 0.35
              ? amberGlow
              : emeraldGlow;
        cell.mat.color.lerp(targetBase, 0.14);
        cell.mat.emissive.lerp(targetGlow, 0.14);
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
      cellGeo.dispose();
      cells.forEach((c) => c.mat.dispose());
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Topografi 3D matriks korelasi dan kovariansi antar aset"
      className="relative h-[250px] w-full cursor-grab active:cursor-grabbing sm:h-[300px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
        <span className="rounded-md border border-hairline bg-obsidian/88 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-text-secondary backdrop-blur-md">
          {hoveredCell ?? "Sorot menara 3D untuk cek korelasi pasangan"}
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

      <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-emerald-500" />
          <span>Aman (&lt;0.35)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-amber-500" />
          <span>Sedang</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-red-500" />
          <span>Bahaya (≥0.68)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-xs bg-sky-500" />
          <span>Aset Sama (1.0)</span>
        </span>
      </div>
    </div>
  );
}
