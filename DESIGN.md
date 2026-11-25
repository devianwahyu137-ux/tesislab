# TesisLab Design System & Anti-Slop Engineering Contract (`DESIGN.md`)

Grounded in the deterministic craft principles of [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable), [`Nutlope/hallmark`](https://github.com/Nutlope/hallmark), and [`educlopez/ui-craft`](https://github.com/educlopez/ui-craft), this document governs every visual, typographic, and structural decision across TesisLab.

---

## 1. Product Dual-Layer Philosophy

TesisLab enforces a strict psychological and structural boundary between its two route groups:

1. **`(marketing)` — Persuasion & Institutional Trust (`/`, `/methodology`)**
   - **Goal**: Communicate the Anti-Yes-Man thesis in < 5 seconds, prove mathematical rigor, and funnel users into `/terminal/audit` with zero state loss.
   - **Rhythm**: Asymmetric editorial spreads, open typographic statements, interactive mini-previews, and crisp hairline ledger dividers. Never repeat identical 3-column card grids consecutively.
2. **`(terminal)` — High-Density Execution Shell (`/terminal/*`)**
   - **Goal**: Operational clarity under financial pressure (inspired by Koyfin, Linear, and OpenBB).
   - **Chrome**: `100dvh` desktop workspace shell with collapsible left rail, persistent macro regime topbar, resizable split panes (`react-resizable-panels`), and ergonomic bottom bar + drawer (`vaul`) on Mobile & iPad. Zero marketing banners or giant footers inside the terminal.

---

## 2. Hard Anti-Slop Rules (Mechanical Guardrails)

1. **Ban Indiscriminate Neon Glows**:
   - Accent chroma (`--status-cleared`, `--status-conditional`, `--status-rejected`) must occupy `<= 10%` of viewport surface area.
   - Containers use crisp 1px architectural hairlines (`--border-hairline`) and subtle top specular bevels—never heavy multi-colored neon drop shadows on passive panels.
2. **Ban Card-Inside-Card Nesting**:
   - Never wrap a bordered card inside another bordered card when a hairline divider (`border-t border-hairline`), whitespace, or typographic contrast can separate data cleanly.
3. **Ban Untinted Pure Black/White Neutrals**:
   - Dark surfaces are tinted toward cold slate-obsidian (`#080B10` canvas, `#0D1219` rail, `#111722` panel).
   - Light surfaces follow Swiss Financial Paper (`#F3F6FA` canvas, `#FFFFFF` sheet, `#0F172A` slate ink).
4. **Strict Typographic Scale & Measure**:
   - **Editorial Display (`--font-editorial` / Newsreader)**: Reserved for primary thesis headlines, verdict statements, and manifesto pull-quotes (`tracking-[-0.025em]`, `leading-[1.08]`).
   - **Operational UI (`--font-sans` / Plus Jakarta Sans)**: Labels, controls, and prose (`max-width: 66ch` enforced via `.editorial-measure`).
   - **Quantitative Data (`--font-mono` / JetBrains Mono)**: All financial figures, ratios, timestamps, and status codes MUST use `font-variant-numeric: tabular-nums` so numbers align vertically to the decimal point.
5. **Single Dominant Action per View**:
   - Every screen has exactly one primary high-contrast CTA. Secondary actions use quiet architectural borders.

---

## 3. Responsive Ergonomics Matrix

| Viewport | Breakpoint | Navigation Pattern | Panel Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | Compact top bar + fixed bottom module bar + `vaul` More Drawer | Segmented tab switcher (`Input` · `Telemetry` · `Verdict`) to prevent 4,000px vertical scrolling |
| **iPad / Tablet** | `768px – 1023px` | Collapsible 60px icon rail + top macro bar | Balanced stacked or 2-column grid with compact padding |
| **Desktop** | `>= 1024px` | Expandable 228px institutional sidebar (`⌘B` / toggle) + `⌘K` Command Palette | `react-resizable-panels` horizontal split-pane with persisted ratios |
