// Jonathan's orb colours, chosen in the onboarding game and saved in the browser.
export type OrbTheme = { id: string; name: string; a: string; b: string; c: string };

export const ORB_THEMES: OrbTheme[] = [
  { id: "violet", name: "Midnight Violet", a: "oklch(0.9 0.12 85)", b: "oklch(0.72 0.17 300)", c: "oklch(0.58 0.2 285)" },
  { id: "amber", name: "Sunset Amber", a: "oklch(0.92 0.13 90)", b: "oklch(0.78 0.17 55)", c: "oklch(0.62 0.2 30)" },
  { id: "mint", name: "Cyber Mint", a: "oklch(0.95 0.1 140)", b: "oklch(0.8 0.15 165)", c: "oklch(0.6 0.13 190)" },
  { id: "cyan", name: "Electric Cyan", a: "oklch(0.95 0.07 200)", b: "oklch(0.78 0.14 220)", c: "oklch(0.55 0.18 255)" },
  { id: "rose", name: "Rose Quartz", a: "oklch(0.95 0.05 20)", b: "oklch(0.8 0.12 350)", c: "oklch(0.62 0.18 330)" },
];

export const ORB_KEY = "jonathan-orb-theme";

export function applyOrbTheme(id: string | null) {
  if (typeof document === "undefined") return;
  const t = ORB_THEMES.find((x) => x.id === id) ?? ORB_THEMES[0]!;
  const s = document.documentElement.style;
  s.setProperty("--gradient-orb", `radial-gradient(circle at 35% 30%, oklch(0.99 0.03 95) 0%, ${t.a} 30%, ${t.b} 75%, ${t.c} 100%)`);
  s.setProperty("--shadow-glow", `0 0 40px color-mix(in oklch, ${t.a} 45%, transparent), 0 0 90px color-mix(in oklch, ${t.c} 35%, transparent)`);
}

export function savedOrbTheme(): string | null {
  try {
    return localStorage.getItem(ORB_KEY);
  } catch {
    return null;
  }
}
