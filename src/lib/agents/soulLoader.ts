import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "@/lib/i18n/config";

const SOULS_DIR = path.join(process.cwd(), "agents", "souls");

const SOUL_FILES = [
  { key: "data_analyst", filename: "data_analyst.md" },
  { key: "risk_manager", filename: "risk_manager.md" },
  { key: "committee_chair", filename: "committee_chair.md" },
] as const;

/**
 * Strip HTML comments (<!-- ... -->) and collapse excess blank lines
 * to minimize system-prompt token overhead.
 */
export function stripHtmlComments(markdown: string): string {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Safely read and sanitize a single agent soul file from `agents/souls/`.
 */
async function loadSoulFile(filename: string): Promise<string> {
  const safeName = path.basename(filename);
  const fullPath = path.join(SOULS_DIR, safeName);
  const raw = await readFile(fullPath, "utf-8");
  return stripHtmlComments(raw);
}

/**
 * Load all three committee souls and assemble a Single-Pass Multi-Persona
 * system prompt tailored to the requested output language (`id` or `en`).
 */
export async function buildCommitteeSystemPrompt(
  locale: Locale
): Promise<string> {
  const souls = await Promise.all(
    SOUL_FILES.map(async ({ key, filename }) => {
      const content = await loadSoulFile(filename);
      return `### PERSONA: ${key.toUpperCase()}\n${content}`;
    })
  );

  const languageDirective =
    locale === "id"
      ? "Bahasa Indonesia (lugas, profesional, bebas jargon AI, mudah dipahami orang awam)."
      : "English (direct, authoritative, zero AI jargon, clear to a layperson).";

  return [
    "You are executing a Single-Pass Multi-Persona Pre-Mortem Audit for TesisLab.",
    "Embody all three committee personas sequentially in a single structured JSON response.",
    `Output Language for all human-readable fields: ${languageDirective}`,
    "Return ONLY valid JSON matching the VerdictPayload schema. Do not wrap in markdown fences.",
    "",
    ...souls,
  ].join("\n\n");
}
