"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useTheme } from "@/context/ThemeContext";
import type { AuditHistoryEntry } from "@/lib/auditHistory";

export interface BrierCalibration3DRingProps {
  entries: AuditHistoryEntry[];
  userBrier: number | null;
  onSelectEntry?: (auditId: string) => void;
}

/**
 * Interactive Three.js 3D Probabilistic Calibration Target Ring for `/terminal/journal`.
 * Plots rich jewel-toned concentric Brier accuracy zones (Emerald <= 0.14, Amber <= 0.25,
 * Crimson > 0.25) with clickable orbital decision spheres that highlight the ledger entry.
 */
export default function BrierCalibration3DRing({
  entries,
  userBrier,
  onSelectEntry,
}: BrierCalibration3DRingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const stateRef = useRef({ entries, userBrier });
  const onSelectRef = useRef(onSelectEntry);
  const resetYawRef = useRef(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    stateRef.current = { entries, userBrier };
  }, [entries, userBrier]);

  useEffect(() => {
    onSelectRef.current = onSelectEntry;
  }, [onSelectEntry]);

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
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 2.55, 5.4);
    camera.lookAt(0, 0, 0);

    // Rich directional + colored rim lighting (no pale white RoomEnvironment wash-out!)
    const hemi = new THREE.HemisphereLight(
      theme === "light" ? 0xffffff : 0x64748b,
      theme === "light" ? 0xcbd5e1 : 0x090d16,
      theme === "light" ? 1.15 : 0.7
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 0.65);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const root = new THREE.Group();
    root.rotation.x = 0.24;
    scene.add(root);

    // Subtle radar floor disc
    const radarDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.05, 0.02, 48),
      new THREE.MeshStandardMaterial({
        color: theme === "light" ? 0xe2e8f0 : 0x0b1322,
        roughness: 0.8,
        metalness: 0.1,
        transparent: true,
        opacity: 0.65,
      })
    );
    radarDisc.position.y = -0.14;
    root.add(radarDisc);

    // 3 Vivid Concentric Calibration Zone Rings (Inner = Perfect, Mid = Moderate, Outer = Overconfident)
    const ringSpecs = [
      { r: 0.72, base: 0x047857, glow: 0x10b981 },
      { r: 1.32, base: 0xd97706, glow: 0xf59e0b },
      { r: 1.92, base: 0xdc2626, glow: 0xef4444 },
    ];
    const rings: { geo: THREE.TorusGeometry; mat: THREE.MeshStandardMaterial }[] = [];

    ringSpecs.forEach((spec) => {
      const geo = new THREE.TorusGeometry(spec.r, 0.032, 18, 80);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: spec.base,
        emissive: spec.glow,
        emissiveIntensity: 0.55,
        metalness: 0.25,
        roughness: 0.28,
      });
      const mesh = new THREE.Mesh(geo, mat);
      root.add(mesh);
      rings.push({ geo, mat });
    });

    // Central Calibration Core Beacon (Vivid Jewel-Tone Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(0.32, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.58,
      metalness: 0.22,
      roughness: 0.25,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    // Up to 12 Clickable Decision Marker Spheres
    const MAX_MARKERS = 12;
    const markerGeo = new THREE.SphereGeometry(0.115, 18, 18);
    const markers: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];
    for (let i = 0; i < MAX_MARKERS; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.52,
        metalness: 0.2,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(markerGeo, mat);
      mesh.userData = { markerIdx: i };
      root.add(mesh);
      markers.push({ mesh, mat });
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const markerMeshes = markers.map((m) => m.mesh);

    let isDragging = false;
    let prevX = 0;
    let downX = 0;
    let downY = 0;
    let yaw = 0;

    const getHitEntry = (e: PointerEvent): AuditHistoryEntry | null => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(markerMeshes, false);
      if (hits.length === 0) return null;
      const idx = hits[0]!.object.userData.markerIdx as number;
      return stateRef.current.entries[idx] ?? null;
    };

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      downX = e.clientX;
      downY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (isDragging) {
        yaw += (e.clientX - prevX) * 0.01;
        prevX = e.clientX;
        return;
      }
      const hit = getHitEntry(e);
      if (hit) {
        canvas.style.cursor = "pointer";
        const statusTxt =
          hit.actual_outcome === "SUCCESS"
            ? "Berhasil"
            : hit.actual_outcome === "FAILED"
              ? "Gagal"
              : "Belum Dinilai";
        setHoveredLabel(
          `${hit.audit_id} (${hit.track.toUpperCase()}) · Yakin ${hit.submitted_conviction}% · ${statusTxt}`
        );
      } else {
        canvas.style.cursor = "grab";
        setHoveredLabel(null);
      }
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (isDragging && moved < 5) {
        const hit = getHitEntry(e);
        if (hit && onSelectRef.current) {
          onSelectRef.current(hit.audit_id);
        }
      }
      isDragging = false;
    };
    const onLeave = () => {
      setHoveredLabel(null);
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
      camera.position.z = w < 500 ? 6.35 : 5.25;
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

    const emeraldBase = new THREE.Color(0x059669);
    const emeraldGlow = new THREE.Color(0x10b981);
    const amberBase = new THREE.Color(0xd97706);
    const amberGlow = new THREE.Color(0xf59e0b);
    const crimsonBase = new THREE.Color(0xdc2626);
    const crimsonGlow = new THREE.Color(0xef4444);
    const skyBase = new THREE.Color(0x0284c7);
    const skyGlow = new THREE.Color(0x38bdf8);

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const t = (now - start) * 0.001;
      if (resetYawRef.current) {
        yaw = 0;
        resetYawRef.current = false;
      } else if (!isDragging) {
        yaw += 0.0028;
      }
      root.rotation.y += (yaw - root.rotation.y) * 0.08;
      core.rotation.y = t * 0.8;

      const { entries: list, userBrier: brier } = stateRef.current;
      const targetCoreBase =
        brier === null
          ? skyBase
          : brier <= 0.14
            ? emeraldBase
            : brier <= 0.25
              ? amberBase
              : crimsonBase;
      const targetCoreGlow =
        brier === null
          ? skyGlow
          : brier <= 0.14
            ? emeraldGlow
            : brier <= 0.25
              ? amberGlow
              : crimsonGlow;
      coreMat.color.lerp(targetCoreBase, 0.12);
      coreMat.emissive.lerp(targetCoreGlow, 0.12);

      const slice = list.slice(0, MAX_MARKERS);
      markers.forEach((m, idx) => {
        const item = slice[idx];
        if (!item) {
          m.mesh.visible = false;
          return;
        }
        m.mesh.visible = true;
        let radius = 1.1;
        if (item.actual_outcome) {
          const o = item.actual_outcome === "SUCCESS" ? 1 : 0;
          const err = Math.abs(item.submitted_conviction / 100 - o);
          radius = 0.48 + err * 1.55;
          m.mat.color.copy(err <= 0.35 ? emeraldBase : crimsonBase);
          m.mat.emissive.copy(err <= 0.35 ? emeraldGlow : crimsonGlow);
        } else {
          const gapErr = Math.abs(item.submitted_conviction - item.score) / 100;
          radius = 0.55 + gapErr * 1.4;
          m.mat.color.copy(skyBase);
          m.mat.emissive.copy(skyGlow);
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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      coreGeo.dispose();
      coreMat.dispose();
      markerGeo.dispose();
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
      markers.forEach((m) => m.mat.dispose());
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Target 3D akurasi kalibrasi Brier Score"
      className="relative h-[240px] w-full cursor-grab active:cursor-grabbing sm:h-[280px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
        <span className="rounded-md border border-hairline bg-obsidian/88 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-text-secondary backdrop-blur-md">
          {hoveredLabel ?? "Sorot / klik bola untuk inspeksi keputusan"}
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
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Tajam (≤0.14)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Sedang</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Meleset</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span>Belum Dinilai</span>
        </span>
      </div>
    </div>
  );
}
