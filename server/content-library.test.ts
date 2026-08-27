import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const library = JSON.parse(
  fs.readFileSync(path.join(root, "content", "seed", "teaching-library.json"), "utf8")
) as {
  architecture: Record<string, string>;
  totalTeachings: number;
  publicationTeachings: number;
  websiteTeachings: number;
  teachings: Array<{
    sourceKey: string;
    sourceType: string;
    sourceUrl?: string | null;
    slug: string;
    title: string;
    collection: string;
    summary: string;
    bodyMarkdown: string;
    keyThemes: string[];
    reflectionPrompts: string[];
    practiceInvitation: string;
    medicalDisclaimer: boolean;
    heroImageUrl?: string | null;
  }>;
};

const migration = fs.readFileSync(
  path.join(root, "drizzle", "0003_teaching_provenance.sql"),
  "utf8"
);
const syncScript = fs.readFileSync(
  path.join(root, "scripts", "sync-teaching-library.mjs"),
  "utf8"
);
const railway = JSON.parse(fs.readFileSync(path.join(root, "railway.json"), "utf8"));

describe("teaching library release contract", () => {
  it("contains the complete validated source library", () => {
    expect(library.totalTeachings).toBe(287);
    expect(library.publicationTeachings).toBe(90);
    expect(library.websiteTeachings).toBe(197);
    expect(library.teachings).toHaveLength(287);
  });

  it("has unique stable source keys and slugs", () => {
    expect(new Set(library.teachings.map(item => item.sourceKey)).size).toBe(287);
    expect(new Set(library.teachings.map(item => item.slug)).size).toBe(287);
  });

  it("requires complete editorial and reflection content", () => {
    for (const teaching of library.teachings) {
      expect(teaching.title.trim().length).toBeGreaterThan(3);
      expect(teaching.summary.trim().length).toBeGreaterThan(40);
      expect(teaching.bodyMarkdown.trim().length).toBeGreaterThan(250);
      expect(teaching.keyThemes.length).toBeGreaterThanOrEqual(3);
      expect(teaching.reflectionPrompts).toHaveLength(3);
      expect(teaching.practiceInvitation.trim().length).toBeGreaterThan(60);
    }
  });

  it("uses only the required production infrastructure", () => {
    expect(library.architecture).toEqual({
      sourceControl: "GitHub",
      deployment: "Railway",
      database: "MySQL",
      media: "Bunny",
    });
    expect(JSON.stringify(library)).not.toMatch(/manuscdn|tidb/i);
    for (const teaching of library.teachings) {
      if (teaching.heroImageUrl) expect(teaching.heroImageUrl).toMatch(/^https:\/\/(?:[^/]+\.)?b-cdn\.net\//);
    }
  });

  it("preserves official source attribution for website articles", () => {
    const website = library.teachings.filter(item => item.sourceType === "website");
    expect(website).toHaveLength(197);
    for (const teaching of website) {
      expect(teaching.sourceUrl).toMatch(/^https:\/\/susandrury\.com\/blog\//);
      expect(teaching.sourceKey).toMatch(/^web:/);
    }
  });
});

describe("Railway MySQL import contract", () => {
  it("commits provenance and import-ledger schema changes", () => {
    expect(migration).toContain("CREATE TABLE `content_imports`");
    expect(migration).toContain("ADD `sourceKey`");
    expect(migration).toContain("teachings_source_key_unique");
    expect(migration).toContain("ADD `heroImageUrl`");
    expect(migration).toContain("ADD `medicalDisclaimer`");
  });

  it("uses a transaction and idempotent upserts", () => {
    expect(syncScript).toContain("beginTransaction");
    expect(syncScript).toContain("rollback");
    expect(syncScript).toContain("ON DUPLICATE KEY UPDATE");
    expect(syncScript).toContain("content_imports");
    expect(syncScript).toContain("Non-Bunny hero image rejected");
  });

  it("runs migrations, verification, and content sync before Railway starts", () => {
    expect(railway.deploy.preDeployCommand).toEqual([
      "pnpm db:migrate && pnpm db:verify && pnpm content:sync",
    ]);
  });
});
