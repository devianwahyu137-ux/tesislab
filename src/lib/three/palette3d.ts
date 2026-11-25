/**
 * Shared Jewel-Tone 3D Palette & Theme Tokens for TesisLab Three.js Stages.
 * Ensures consistent saturation, contrast, and stage plates across all 3D charts.
 */
export const THREE_JEWEL_PALETTE = {
  emerald: 0x059669,
  emeraldGlow: 0x10b981,
  amber: 0xd97706,
  amberGlow: 0xf59e0b,
  crimson: 0xe11d48,
  crimsonGlow: 0xf43f5e,
  sky: 0x0284c7,
  skyGlow: 0x38bdf8,
  stagePlate: {
    dark: 0x0b1322,
    light: 0xe2e8f0,
  },
  gridPrimary: {
    dark: 0x10b981,
    light: 0x64748b,
  },
  gridSecondary: {
    dark: 0x1e293b,
    light: 0xcbd5e1,
  },
} as const;
