"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/context/ThemeContext";

export type SuiteModuleId =
  | "audit"
  | "compare"
  | "import"
  | "portfolio"
  | "journal"
  | "warroom";

export interface Terminal3DPreviewCanvasProps {
  activeModule: SuiteModuleId;
}

/**
 * GPU-lightweight, IntersectionObserver-paused Three.js PBR Quantitative Topology Stage.
 * Dynamically morphs 16 precision pillars & orbital rings into 6 distinct mathematical
 * structures representing each workstation in the TesisLab Terminal.
 */
export default function Terminal3DPreviewCanvas({
  activeModule,
}: Terminal3DPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const activeModuleRef = useRef<SuiteModuleId>(activeModule);

  useEffect(() => {
    activeModuleRef.current = activeModule;
  }, [activeModule]);

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
    renderer.toneMappingExposure = theme === "light" ? 1.0 : 1.15;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(0, 2.2, 6.2);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xcbe0f5, theme === "light" ? 1.1 : 0.72);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x10b981, 2.1, 14);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    // Base architectural platform plate
    const plateGeo = new THREE.BoxGeometry(3.8, 0.08, 3.8);
    const plateMat = new THREE.MeshStandardMaterial({
      color: theme === "light" ? 0xe2e8f0 : 0x0f172a,
      metalness: 0.7,
      roughness: 0.28,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -0.95;
    root.add(plate);

    const gridHelper = new THREE.GridHelper(
      3.6,
      8,
      theme === "light" ? 0x94a3b8 : 0x10b981,
      theme === "light" ? 0xcbd5e1 : 0x1e293b
    );
    gridHelper.position.y = -0.9;
    root.add(gridHelper);

    // 16 Morphing Quantitative Pillars (4x4 matrix capable of forming bars, dual curves, correlation surface, or agent stations)
    const COUNT = 16;
    const pillarGeo = new THREE.BoxGeometry(0.32, 1, 0.32);
    const pillars: {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      targetPos: THREE.Vector3;
      targetScaleY: number;
      targetColor: THREE.Color;
    }[] = [];

    const emerald = new THREE.Color(0x059669);
    const amber = new THREE.Color(0xd97706);
    const crimson = new THREE.Color(0xe11d48);
    const cyan = new THREE.Color(0x0284c7);

    for (let i = 0; i < COUNT; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        color: emerald.clone(),
        emissive: emerald.clone(),
        emissiveIntensity: theme === "light" ? 0.18 : 0.48,
        metalness: 0.25,
        roughness: 0.26,
      });
      const mesh = new THREE.Mesh(pillarGeo, mat);
      root.add(mesh);
      pillars.push({
        mesh,
        mat,
        targetPos: new THREE.Vector3(),
        targetScaleY: 1,
        targetColor: emerald.clone(),
      });
    }

    // Precision Gyro Ring
    const ringGeo = new THREE.TorusGeometry(2.15, 0.022, 16, 84);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: theme === "light" ? 0.15 : 0.45,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4;
    root.add(ring);

    const computeTargets = (mod: SuiteModuleId, t: number) => {
      for (let i = 0; i < COUNT; i += 1) {
        const p = pillars[i];
        const row = Math.floor(i / 4);
        const col = i % 4;

        if (mod === "audit") {
          // Rising candlestick / ATR channel staircase
          const x = (i - 7.5) * 0.21;
          const h = 0.45 + Math.sin(i * 0.65 + t * 1.4) * 0.35 + (i / COUNT) * 0.9;
          p.targetPos.set(x, -0.9 + h / 2, (i % 2 === 0 ? -1 : 1) * 0.18);
          p.targetScaleY = Math.max(0.2, h);
          p.targetColor.copy(i % 5 === 2 ? crimson : emerald);
        } else if (mod === "compare") {
          // Two parallel competing trajectories (Scenario A vs Scenario B)
          const lane = i < 8 ? -0.68 : 0.68;
          const idx = i % 8;
          const x = (idx - 3.5) * 0.42;
          const h =
            i < 8
              ? 0.55 + idx * 0.16 + Math.sin(t * 1.5 + idx * 0.4) * 0.12
              : 1.35 - idx * 0.11 + Math.cos(t * 1.5 + idx * 0.4) * 0.12;
          p.targetPos.set(x, -0.9 + h / 2, lane);
          p.targetScaleY = Math.max(0.22, h);
          p.targetColor.copy(i < 8 ? emerald : amber);
        } else if (mod === "import") {
          // 4 sorted cashflow ledger stacks (Income, Fixed, Debt, Reserve)
          const stackX = (col - 1.5) * 0.82;
          const stackZ = (row - 1.5) * 0.45;
          const h =
            col === 0
              ? 1.45
              : col === 1
                ? 0.95
                : col === 2
                  ? 0.62
                  : 1.15;
          const pulse = Math.sin(t * 2 + row * 0.8 + col) * 0.08;
          p.targetPos.set(stackX, -0.9 + (h + pulse) / 2, stackZ);
          p.targetScaleY = Math.max(0.2, h + pulse);
          p.targetColor.copy(
            col === 0 ? emerald : col === 2 ? crimson : cyan
          );
        } else if (mod === "portfolio") {
          // 4x4 Correlation Matrix Heatmap Surface
          const x = (col - 1.5) * 0.72;
          const z = (row - 1.5) * 0.72;
          const isDiag = row === col;
          const corr = isDiag
            ? 1.55
            : 0.45 + 0.45 * Math.abs(Math.sin(row * 1.7 + col * 1.1 + t * 0.9));
          p.targetPos.set(x, -0.9 + corr / 2, z);
          p.targetScaleY = corr;
          p.targetColor.copy(
            isDiag ? cyan : corr > 0.78 ? crimson : emerald
          );
        } else if (mod === "journal") {
          // Circular Brier Calibration Radar Ring
          const angle = (i / COUNT) * Math.PI * 2 + t * 0.25;
          const radius = 1.32;
          const h = 0.55 + 0.45 * Math.cos(i * 0.9 - t * 1.3);
          p.targetPos.set(
            Math.cos(angle) * radius,
            -0.9 + Math.max(0.25, h) / 2,
            Math.sin(angle) * radius
          );
          p.targetScaleY = Math.max(0.25, h);
          p.targetColor.copy(h > 0.75 ? emerald : cyan);
        } else {
          // 3D War-Room 4-Division Clusters (Hermes, Quant, Risk, Chair)
          const quad = i % 4;
          const sub = Math.floor(i / 4);
          const angle = (quad * Math.PI) / 2 + Math.PI / 4;
          const cx = Math.cos(angle) * 0.95;
          const cz = Math.sin(angle) * 0.95;
          const ox = ((sub % 2) - 0.5) * 0.36;
          const oz = (Math.floor(sub / 2) - 0.5) * 0.36;
          const h = 0.65 + (sub === 0 ? 0.65 : 0.22) + Math.sin(t * 2 + quad) * 0.08;
          p.targetPos.set(cx + ox, -0.9 + h / 2, cz + oz);
          p.targetScaleY = h;
          p.targetColor.copy(
            quad === 0
              ? cyan
              : quad === 1
                ? emerald
                : quad === 2
                  ? crimson
                  : amber
          );
        }
      }
    };

    // Pointer drag orbit
    let isDragging = false;
    let prevX = 0;
    let userYaw = 0.45;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      prevX = e.clientX;
      userYaw += dx * 0.01;
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
      camera.position.z = w < 500 ? 6.9 : 5.9;
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

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = (now - start) * 0.001;
      computeTargets(activeModuleRef.current, elapsed);

      if (!isDragging && !reducedMotion) {
        userYaw += 0.0032;
      }
      root.rotation.y += (userYaw - root.rotation.y) * 0.08;
      ring.rotation.z = elapsed * 0.35;

      for (let i = 0; i < COUNT; i += 1) {
        const p = pillars[i];
        p.mesh.position.lerp(p.targetPos, 0.1);
        p.mesh.scale.y += (p.targetScaleY - p.mesh.scale.y) * 0.1;
        p.mat.color.lerp(p.targetColor, 0.1);
        p.mat.emissive.lerp(p.targetColor, 0.1);
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
      pillarGeo.dispose();
      plateGeo.dispose();
      plateMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pillars.forEach((p) => p.mat.dispose());
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Pratinjau 3D topologi modul ${activeModule}`}
      className="relative h-[230px] w-full cursor-grab active:cursor-grabbing sm:h-[300px] lg:h-[360px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
