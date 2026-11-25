"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useTheme } from "@/context/ThemeContext";
import type { AuditHistoryEntry } from "@/lib/auditHistory";

export interface BrierCalibration3DRingProps {
  entries: AuditHistoryEntry[];
  userBrier: number | null;
}

/**
 * Interactive Three.js 3D Probabilistic Calibration Target Ring for `/terminal/journal`.
 * Plots concentric Brier accuracy zones (Emerald <= 0.14, Amber <= 0.25, Crimson > 0.25)
 * and renders resolved decision outcomes as orbital 3D markers around the accuracy core.
 */
export default function BrierCalibration3DRing({
  entries,
  userBrier,
}: BrierCalibration3DRingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const stateRef = useRef({ entries, userBrier });

  useEffect(() => {
    stateRef.current = { entries, userBrier };
  }, [entries, userBrier]);

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

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 2.55, 5.4);
    camera.lookAt(0, 0, 0);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const root = new THREE.Group();
    root.rotation.x = 0.22;
    scene.add(root);

    // 3 Concentric Calibration Zone Rings (Inner = Perfect, Mid = Moderate, Outer = Overconfident)
    const ringSpecs = [
      { r: 0.72, color: 0x10b981 },
      { r: 1.32, color: 0xf59e0b },
      { r: 1.92, color: 0xef4444 },
    ];
    const rings: { geo: THREE.TorusGeometry; mat: THREE.MeshStandardMaterial }[] = [];

    ringSpecs.forEach((spec) => {
      const geo = new THREE.TorusGeometry(spec.r, 0.024, 16, 72);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: theme === "light" ? 0.12 : 0.28,
        metalness: 0.75,
        roughness: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      root.add(mesh);
      rings.push({ geo, mat });
    });

    // Central Calibration Core Beacon
    const coreGeo = new THREE.IcosahedronGeometry(0.32, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      metalness: 0.2,
      roughness: 0.15,
      transmission: 0.3,
      clearcoat: 1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    // Up to 12 Decision Marker Spheres
    const MAX_MARKERS = 12;
    const markerGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const markers: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];
    for (let i = 0; i < MAX_MARKERS; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.35,
        metalness: 0.4,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(markerGeo, mat);
      root.add(mesh);
      markers.push({ mesh, mat });
    }

    let isDragging = false;
    let prevX = 0;
    let yaw = 0;
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
      camera.position.z = w < 500 ? 6.4 : 5.3;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let isVisible = true;
    const io = new IntersectionObserver(
      (entriesList) => {
        isVisible = entriesList[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    const emerald = new THREE.Color(0x10b981);
    const amber = new THREE.Color(0xf59e0b);
    const crimson = new THREE.Color(0xef4444);
    const sky = new THREE.Color(0x38bdf8);

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const t = (now - start) * 0.001;
      if (!isDragging) yaw += 0.003;
      root.rotation.y += (yaw - root.rotation.y) * 0.08;
      core.rotation.y = t * 0.8;

      const { entries: list, userBrier: brier } = stateRef.current;
      const coreColor =
        brier === null
          ? sky
          : brier <= 0.14
            ? emerald
            : brier <= 0.25
              ? amber
              : crimson;
      coreMat.color.lerp(coreColor, 0.1);

      const slice = list.slice(0, MAX_MARKERS);
      markers.forEach((m, idx) => {
        const item = slice[idx];
        if (!item) {
          m.mesh.visible = false;
          return;
        }
        m.mesh.visible = true;
        // Distance from bullseye center = calibration error
        let radius = 1.1;
        if (item.actual_outcome) {
          const o = item.actual_outcome === "SUCCESS" ? 1 : 0;
          const err = Math.abs(item.submitted_conviction / 100 - o);
          radius = 0.48 + err * 1.55;
          m.mat.color.copy(err <= 0.35 ? emerald : crimson);
          m.mat.emissive.copy(err <= 0.35 ? emerald : crimson);
        } else {
          const gapErr = Math.abs(item.submitted_conviction - item.score) / 100;
          radius = 0.55 + gapErr * 1.4;
          m.mat.color.copy(sky);
          m.mat.emissive.copy(sky);
        }
        const angle = (idx / Math.max(1, slice.length)) * Math.PI * 2 + t * 0.2;
        m.mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(t * 2 + idx) * 0.08,
          Math.sin(angle) * radius
        );
      });

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
      coreGeo.dispose();
      coreMat.dispose();
      markerGeo.dispose();
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
      markers.forEach((m) => m.mat.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="relative h-[210px] w-full cursor-grab active:cursor-grabbing sm:h-[240px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
