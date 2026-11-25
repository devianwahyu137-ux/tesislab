"use client";

import { Component, type ReactNode } from "react";

interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

/**
 * Local Error Boundary wrapping WebGL / Three.js 3D stages so a GPU context
 * crash never brings down the surrounding audit or marketing page.
 */
export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  state: WebGLErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-lg border border-hairline bg-obsidian/80 p-6 text-center font-mono text-xs text-text-muted">
          {this.props.fallbackLabel ??
            "Visualisasi 3D tidak tersedia pada perangkat ini."}
        </div>
      );
    }
    return this.props.children;
  }
}
