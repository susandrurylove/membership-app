import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const css = read("client/src/index.css");
const shell = read("client/src/components/MemberShell.tsx");
const primaryPages = [
  "client/src/pages/Login.tsx",
  "client/src/pages/Home.tsx",
  "client/src/pages/Teachings.tsx",
  "client/src/pages/TeachingDetail.tsx",
  "client/src/pages/Courses.tsx",
  "client/src/pages/CourseDetail.tsx",
  "client/src/pages/Apps.tsx",
  "client/src/pages/Admin.tsx",
  "client/src/pages/AcceptInvitation.tsx",
  "client/src/pages/NotFound.tsx",
];

const primarySource = primaryPages.map(file => read(file)).join("\n");

describe("SusanDrury.com brand parity", () => {
  it("defines the measured core palette as named design tokens", () => {
    expect(css).toContain("--sd-navy: #1e234c");
    expect(css).toContain("--sd-gold: #c9a84c");
    expect(css).toContain("--sd-ivory: #fdfaf5");
    expect(css).toContain("--sd-teal: #2d7d7d");
    expect(css).toContain('font-family: "Lora"');
  });

  it("provides reusable branded hero, panel, chip, card, and reading treatments", () => {
    for (const className of [".brand-hero", ".brand-panel", ".brand-chip", ".teaching-card", ".reading-surface"]) {
      expect(css).toContain(className);
    }
  });

  it("uses the ceremonial brand hero on every principal portal surface", () => {
    for (const file of primaryPages) {
      const source = read(file);
      expect(source, `${file} must use the shared brand hero or panel system`).toMatch(/brand-hero|brand-panel/);
    }
  });

  it("keeps the mandala identity visible and descriptive in the member shell", () => {
    expect(shell).toContain("SUSAN_LOGO.medium");
    expect(shell).toContain('alt="Susan Drury"');
    expect(shell).toContain("bg-[#1e234c]");
    expect(shell).toContain("text-[#ead79c]");
  });

  it("renders Bunny hero imagery and structured reflection content in teachings", () => {
    const list = read("client/src/pages/Teachings.tsx");
    const detail = read("client/src/pages/TeachingDetail.tsx");
    expect(list).toContain("item.heroImageUrl");
    expect(list).toContain("item.readingMinutes");
    expect(detail).toContain("item.reflectionPrompts");
    expect(detail).toContain("item.practiceInvitation");
    expect(detail).toContain("item.medicalDisclaimer");
    expect(detail).toContain("item.sourceUrl");
  });

  it("does not fall back to generic product-template color utilities", () => {
    expect(primarySource).not.toMatch(/(?:bg|text|border)-(?:blue|slate|purple|pink|orange|emerald)-\d+/);
  });
});
