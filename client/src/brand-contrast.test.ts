import { describe, expect, it } from "vitest";

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return 0.2126 * channel((value >> 16) & 255) + 0.7152 * channel((value >> 8) & 255) + 0.0722 * channel(value & 255);
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const textPairs = [
  { label: "navy editorial text on ivory", foreground: "#243f4d", background: "#fffdf8" },
  { label: "muted body text on ivory", foreground: "#58686d", background: "#fffdf8" },
  { label: "teal link text on ivory", foreground: "#2f7772", background: "#fffdf8" },
  { label: "white button text on teal", foreground: "#ffffff", background: "#2f7772" },
  { label: "gold eyebrow text on pale gold", foreground: "#77580f", background: "#f5eddb" },
  { label: "error text on error surface", foreground: "#823b32", background: "#fff8f4" },
  { label: "active status text on mint", foreground: "#246866", background: "#e7f0ec" },
] as const;

describe("Susan Drury color contrast", () => {
  for (const pair of textPairs) {
    it(`${pair.label} meets the 4.5:1 normal-text threshold`, () => {
      expect(contrast(pair.foreground, pair.background)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
