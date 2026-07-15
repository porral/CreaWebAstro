// Predefined color palettes and font pairings offered at site-creation time.
import type { GenerateInput, SitePlan } from "./site-schema";

export interface ColorPalette {
  id: string;
  label: string;
  // Absent for the "let the AI decide" option.
  colors?: { primary: string; accent: string; background: string; foreground: string };
}

export const PALETTES: ColorPalette[] = [
  { id: "ai", label: "Automático (IA)" },
  {
    id: "purple",
    label: "Púrpura eléctrico",
    colors: { primary: "#a76bff", accent: "#5cd6ff", background: "#0e1020", foreground: "#f5f6fb" },
  },
  {
    id: "ocean",
    label: "Océano",
    colors: { primary: "#22d3ee", accent: "#3b82f6", background: "#081826", foreground: "#eaf6fb" },
  },
  {
    id: "forest",
    label: "Bosque",
    colors: { primary: "#34d399", accent: "#a3e635", background: "#0c1712", foreground: "#eef7f0" },
  },
  {
    id: "sunset",
    label: "Atardecer",
    colors: { primary: "#fb923c", accent: "#f43f5e", background: "#1a0f0a", foreground: "#fdf3ec" },
  },
  {
    id: "mono",
    label: "Monocromo",
    colors: { primary: "#e5e7eb", accent: "#9ca3af", background: "#111214", foreground: "#f4f5f7" },
  },
];

export interface FontPreset {
  id: string;
  label: string;
  headingFamily: string;
  bodyFamily: string;
  googleFontsParam: string;
}

export const FONTS: FontPreset[] = [
  {
    id: "inter-space",
    label: "Moderno (Inter + Space Grotesk)",
    headingFamily: "'Space Grotesk','Inter',sans-serif",
    bodyFamily: "'Inter',system-ui,sans-serif",
    googleFontsParam: "family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600",
  },
  {
    id: "poppins",
    label: "Redondeado (Poppins)",
    headingFamily: "'Poppins',sans-serif",
    bodyFamily: "'Poppins',sans-serif",
    googleFontsParam: "family=Poppins:wght@400;500;600;700",
  },
  {
    id: "serif",
    label: "Elegante (Playfair Display + Merriweather)",
    headingFamily: "'Playfair Display',serif",
    bodyFamily: "'Merriweather',serif",
    googleFontsParam: "family=Playfair+Display:wght@600;700&family=Merriweather:wght@400;500",
  },
  {
    id: "mono",
    label: "Técnico (Roboto Mono + Roboto)",
    headingFamily: "'Roboto Mono',monospace",
    bodyFamily: "'Roboto',system-ui,sans-serif",
    googleFontsParam: "family=Roboto+Mono:wght@500;700&family=Roboto:wght@400;500;600",
  },
];

export const DEFAULT_PALETTE = PALETTES[1]!; // purple — matches the app's previous hardcoded look
export const DEFAULT_FONT = FONTS[0]!;

// Applies the user's chosen palette/font on top of an AI-generated plan.
// When colorPalette is "ai" (or unknown), the AI's own brandColors are kept.
export function applyThemeToPlan(plan: SitePlan, config: GenerateInput): void {
  const palette = PALETTES.find((p) => p.id === config.colorPalette);
  if (palette?.colors) {
    plan.brandColors = { ...palette.colors };
  } else if (!plan.brandColors) {
    plan.brandColors = { ...DEFAULT_PALETTE.colors! };
  }

  const font = FONTS.find((f) => f.id === config.fontFamily) ?? DEFAULT_FONT;
  plan.fontFamily = {
    id: font.id,
    headingFamily: font.headingFamily,
    bodyFamily: font.bodyFamily,
    googleFontsParam: font.googleFontsParam,
  };
}
