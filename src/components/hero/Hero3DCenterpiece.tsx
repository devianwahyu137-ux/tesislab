"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTheme } from "@/context/ThemeContext";

/**
 * Unboxed Interactive 3D Hero Centerpiece powered by Pure Three.js (alpha: true).
 * Renders a bright, glossy Obsidian/Emerald/Gold Kinetic Candlestick Monolith +
 * Golden Veto Gimbal Rings that tilt smoothly toward the user's cursor and pulse on click.
 */
export default function Hero3DCenterpiece() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 60);
    camera.position.set(0, 1.45, 5.4);
    camera.lookAt(0, 0.15, 0);

    // Bright Studio 3-Point Lighting so the 3D sculpture pops in both Dark & Light modes
    const hemi = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.35);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(4.5, 6.5, 5);
    scene.add(key);

    const emeraldRim = new THREE.PointLight(0x10b981, 2.2, 10);
    emeraldRim.position.set(-3.2, 1.5, 2.4);
    scene.add(emeraldRim);

    const goldRim = new THREE.PointLight(0xf59e0b, 1.8, 10);
    goldRim.position.set(3.2, 1.8, 2.2);
    scene.add(goldRim);

    // Root Interactive Sculpture Group
    const sculpture = new THREE.Group();
    scene.add(sculpture);

    // Floating Obsidian & Gold Pedestal Slab
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x151c26,
      roughness: 0.32,
      metalness: 0.45,
    });
    const slab = new THREE.Mesh(
      new RoundedBoxGeometry(2.65, 0.18, 1.45, 3, 0.04),
      slabMat
    );
    slab.position.y = -0.58;
    sculpture.add(slab);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.8,
    });
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.35,
    });
    const coralMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.3,
    });
    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.45,
    });

    // Gold base trim ring
    const baseTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.024, 12, 64),
      goldMat
    );
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = -0.58;
    sculpture.add(baseTrim);

    // 5 Kinetic 3D Glossy Candlestick Pillars
    const candleSpecs = [
      { x: -0.92, h: 0.62, bull: false, phase: 0.0 },
      { x: -0.46, h: 0.92, bull: true, phase: 0.9 },
      { x: 0.0, h: 1.24, bull: true, phase: 1.8 },
      { x: 0.46, h: 0.78, bull: false, phase: 2.7 },
      { x: 0.92, h: 1.05, bull: true, phase: 3.6 },
    ];

    const candleMeshes: { body: THREE.Mesh; baseH: number; phase: number }[] = [];
    candleSpecs.forEach((spec) => {
      const mat = spec.bull ? emeraldMat : coralMat;
      const body = new THREE.Mesh(
        new RoundedBoxGeometry(0.26, spec.h, 0.26, 2, 0.03),
        mat
      );
      body.position.set(spec.x, -0.46 + spec.h / 2, 0);
      sculpture.add(body);

      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, spec.h + 0.36, 8),
        goldMat
      );
      wick.position.set(spec.x, -0.46 + spec.h / 2, 0);
      sculpture.add(wick);

      candleMeshes.push({ body, baseH: spec.h, phase: spec.phase });
    });

    // Orbiting Golden Veto Gimbal Rings
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.022, 12, 72),
      goldMat
    );
    outerRing.position.y = 0.2;
    outerRing.rotation.x = Math.PI / 2.6;
    sculpture.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.018, 12, 64),
      cyanMat
    );
    innerRing.position.y = 0.25;
    innerRing.rotation.x = -Math.PI / 3;
    innerRing.rotation.y = Math.PI / 5;
    sculpture.add(innerRing);

    // Floating Satellite Geometric Nodes (breaking the grid around the sculpture)
    const satellites: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number }[] = [
      {
        mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), emeraldMat),
        basePos: new THREE.Vector3(-2.15, 0.45, 0.2),
        speed: 1.4,
      },
      {
        mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), goldMat),
        basePos: new THREE.Vector3(2.15, 0.65, -0.15),
        speed: 1.7,
      },
      {
        mesh: new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), cyanMat),
        basePos: new THREE.Vector3(1.85, -0.35, 0.55),
        speed: 1.2,
      },
    ];
    satellites.forEach((s) => {
      s.mesh.position.copy(s.basePos);
      sculpture.add(s.mesh);
    });

    // Resize handling
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.position.z = w < 520 ? 6.6 : 5.2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    // Mouse-tracking interactive tilt + click spin boost
    let pointerX = 0;
    let pointerY = 0;
    let spinBoost = 0;

    const onWindowPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      pointerX = Math.max(-1, Math.min(1, nx));
      pointerY = Math.max(-1, Math.min(1, ny));
    };

    const onCanvasClick = () => {
      spinBoost = 4.5;
    };

    window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
    canvas.addEventListener("click", onCanvasClick);

    let disposed = false;
    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const animate = (now: number) => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);

      const dt = Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
      const elapsed = Math.max(0, (now - startTime) / 1000);

      // Subtle material brightness shift for Light Mode
      slabMat.color.setHex(themeRef.current === "light" ? 0x1e293b : 0x151c26);

      if (spinBoost > 0.01) {
        spinBoost *= 0.94;
      } else {
        spinBoost = 0;
      }

      if (!reducedMotion) {
        // Gentle floating levitation + smooth cursor tilt
        sculpture.position.y = Math.sin(elapsed * 1.4) * 0.08;
        const targetRotY = pointerX * 0.36 + Math.sin(elapsed * 0.45) * 0.14;
        const targetRotX = pointerY * 0.16;
        sculpture.rotation.y += (targetRotY - sculpture.rotation.y) * 0.07;
        sculpture.rotation.x += (targetRotX - sculpture.rotation.x) * 0.07;

        outerRing.rotation.z += dt * (0.45 + spinBoost);
        innerRing.rotation.z -= dt * (0.65 + spinBoost * 1.2);

        candleMeshes.forEach((c) => {
          const pulse = 0.9 + 0.14 * Math.sin(elapsed * 1.9 + c.phase);
          c.body.scale.y = pulse;
          c.body.position.y = -0.46 + (c.baseH * pulse) / 2;
        });

        satellites.forEach((s, i) => {
          s.mesh.rotation.y += dt * s.speed;
          s.mesh.rotation.x += dt * (s.speed * 0.6);
          s.mesh.position.y =
            s.basePos.y + Math.sin(elapsed * 1.8 + i * 2.1) * 0.12;
        });
      }

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("pointermove", onWindowPointerMove);
      canvas.removeEventListener("click", onCanvasClick);

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

  return (
    <div
      ref={containerRef}
      className="relative mx-auto h-[230px] w-full max-w-2xl cursor-pointer sm:h-[265px]"
      title="Interactive 3D Risk Sculpture — click to spin"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
