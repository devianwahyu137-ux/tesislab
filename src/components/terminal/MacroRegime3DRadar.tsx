"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useTheme } from "@/context/ThemeContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface MacroRegime3DRadarProps {
  macroContext: MarketContext;
}

/**
 * Interactive Three.js 3D Macro Regime Gyroscopic Tensor Radar for `/terminal`.
 * Visualizes today's Hermes macro regime (RISK_OFF / CAUTIOUS / RISK_ON) as a PBR
 * octahedral core surrounded by 4 live asset momentum pillars (USD/IDR, IHSG, GOLD, BTC).
 */
export default function MacroRegime3DRadar({
  macroContext,
}: MacroRegime3DRadarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const regime = macroContext.synthesis.macro_regime;
  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;

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
    camera.position.set(0, 2.0, 5.2);
    camera.lookAt(0, 0, 0);

    const coreHex =
      regime === "RISK_OFF"
        ? 0xef4444
        : regime === "RISK_ON"
          ? 0x10b981
          : 0xf59e0b;

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const accentLight = new THREE.PointLight(coreHex, 3.4, 12);
    accentLight.position.set(0, 1.5, 2);
    scene.add(accentLight);

    const root = new THREE.Group();
    scene.add(root);

    // Central Octahedral Regime Core
    const coreGeo = new THREE.OctahedronGeometry(0.68, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: coreHex,
      emissive: coreHex,
      emissiveIntensity: theme === "light" ? 0.18 : 0.36,
      metalness: 0.25,
      roughness: 0.16,
      transmission: 0.35,
      thickness: 0.7,
      clearcoat: 1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    root.add(coreMesh);

    // Dual Gyroscopic Radar Rings
    const ringGeo1 = new THREE.TorusGeometry(1.38, 0.02, 16, 72);
    const ringGeo2 = new THREE.TorusGeometry(1.75, 0.015, 16, 72);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: coreHex,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: theme === "light" ? 0x64748b : 0x38bdf8,
      metalness: 0.8,
      roughness: 0.25,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring1.rotation.x = Math.PI / 2.6;
    ring2.rotation.y = Math.PI / 3;
    root.add(ring1);
    root.add(ring2);

    // 4 Satellite Asset Nodes (USD/IDR, IHSG, GOLD, BTC)
    const changes = [
      USD_IDR.change_pct,
      IHSG.change_pct,
      GOLD_USD.change_pct,
      BTC_USD.change_pct,
    ];
    const satGeo = new THREE.BoxGeometry(0.26, 0.7, 0.26);
    const satellites: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; baseAngle: number; delta: number }[] = [];

    changes.forEach((delta, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: delta >= 0 ? 0x10b981 : 0xef4444,
        metalness: 0.5,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(satGeo, mat);
      const scaleY = Math.max(0.35, Math.min(1.6, 0.65 + Math.abs(delta) * 0.14));
      mesh.scale.y = scaleY;
      root.add(mesh);
      satellites.push({
        mesh,
        mat,
        baseAngle: (idx * Math.PI) / 2,
        delta,
      });
    });

    let isDragging = false;
    let prevX = 0;
    let yaw = 0.3;
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

      const t = (now - start) * 0.001;
      if (!isDragging) yaw += 0.004;

      root.rotation.y += (yaw - root.rotation.y) * 0.08;
      coreMesh.rotation.y = t * 0.7;
      coreMesh.rotation.x = Math.sin(t * 0.8) * 0.25;
      ring1.rotation.z = t * 0.45;
      ring2.rotation.x = Math.PI / 3 + t * 0.3;

      satellites.forEach((sat, idx) => {
        const a = sat.baseAngle + t * 0.28;
        sat.mesh.position.set(
          Math.cos(a) * 1.55,
          Math.sin(t * 1.6 + idx) * 0.14,
          Math.sin(a) * 1.55
        );
        sat.mesh.rotation.y = -a;
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
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      satGeo.dispose();
      satellites.forEach((s) => s.mat.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [theme, regime, USD_IDR.change_pct, IHSG.change_pct, GOLD_USD.change_pct, BTC_USD.change_pct]);

  return (
    <div
      ref={containerRef}
      className="relative h-[215px] w-full cursor-grab active:cursor-grabbing sm:h-[230px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute right-3 bottom-2 left-3 flex items-center justify-between font-mono text-[10px] text-text-secondary">
        <span>● USD/IDR · IHSG</span>
        <span>● XAU · BTC</span>
      </div>
    </div>
  );
}
