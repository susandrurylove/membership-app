import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateNextDueAt, dailySequenceForDate, isValidTimeZone } from "./dailyTeaching";
import { dailyTeachingEmailContent } from "./dailyTeachingMailer";

describe("Daily Teaching rotation and reminders", () => {
  it("rotates deterministically through all 365 positions", () => {
    expect(dailySequenceForDate(new Date("2026-01-01T18:00:00Z"))).toBe(1);
    expect(dailySequenceForDate(new Date("2026-12-31T18:00:00Z"))).toBe(365);
    expect(dailySequenceForDate(new Date("2027-01-01T18:00:00Z"))).toBe(1);
  });

  it("validates IANA timezones and schedules future daily and weekly delivery", () => {
    expect(isValidTimeZone("America/Denver")).toBe(true);
    expect(isValidTimeZone("not/a-timezone")).toBe(false);
    const from = new Date("2026-09-11T18:00:00Z");
    const daily = calculateNextDueAt("daily", "America/Denver", 8, from);
    const weekly = calculateNextDueAt("weekly", "America/Denver", 8, from);
    expect(daily.getTime()).toBeGreaterThan(from.getTime());
    expect(weekly.getTime() - daily.getTime()).toBe(6 * 86_400_000);
  });

  it("escapes member and teaching text in the SMTP2GO email template", () => {
    const content = dailyTeachingEmailContent({
      id: 1,
      sequence: 1,
      sourceKey: "test",
      sourceType: "book",
      sourceTitle: "Source",
      sourceLocator: "p. 1",
      sourceUrl: null,
      existingTeachingSlug: null,
      collection: "Begin Here",
      slug: "safe-teaching",
      title: "A <Gentle> Beginning",
      summary: "Summary & invitation",
      body: "Meet this moment without force.",
      reflectionPrompt: "What feels true?",
      practice: "Take one breath.",
      sourceNote: "Adapted with care.",
      safetyNote: null,
      medicalDisclaimer: false,
      imageUrl: "https://membership-susan.b-cdn.net/daily-teachings/v1/safe-teaching.webp",
      imageAlt: "A quiet landscape",
      totalWordCount: 35,
      contentHash: "a".repeat(64),
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    }, "<Susan>");
    expect(content.html).toContain("Dear &lt;Susan&gt;,");
    expect(content.html).toContain("A &lt;Gentle&gt; Beginning");
    expect(content.html).not.toContain("Dear <Susan>");
    expect(content.url).toBe("https://membership.susandrury.com/daily-teachings/safe-teaching");
  });
});

describe("Daily Teaching and Healing Music release contracts", () => {
  const root = process.cwd();
  const daily = JSON.parse(fs.readFileSync(path.join(root, "content/seed/daily-teachings.json"), "utf8"));
  const music = JSON.parse(fs.readFileSync(path.join(root, "content/seed/healing-music.json"), "utf8"));
  const schema = fs.readFileSync(path.join(root, "drizzle/schema.ts"), "utf8");
  const railway = JSON.parse(fs.readFileSync(path.join(root, "railway.json"), "utf8"));
  const home = fs.readFileSync(path.join(root, "client/src/pages/Home.tsx"), "utf8");
  const app = fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8");
  const html = fs.readFileSync(path.join(root, "client/index.html"), "utf8");
  const musicPage = fs.readFileSync(path.join(root, "client/src/pages/Music.tsx"), "utf8");

  it("contains exactly 365 concise, uniquely illustrated Daily Teachings", () => {
    expect(daily.teachings).toHaveLength(365);
    expect(Math.max(...daily.teachings.map((item: { totalWordCount: number }) => item.totalWordCount))).toBeLessThanOrEqual(400);
    expect(new Set(daily.teachings.map((item: { imageUrl: string }) => item.imageUrl)).size).toBe(365);
  });

  it("contains exactly 23 Bunny-hosted songs with body mappings", () => {
    expect(music.tracks).toHaveLength(23);
    expect(new Set(music.tracks.map((track: { webUrl: string }) => track.webUrl)).size).toBe(23);
    expect(music.tracks.every((track: { webUrl: string; bodyKeys: string[] }) => track.webUrl.startsWith("https://susan-website-pull.b-cdn.net/healing-music/v1/mp3/") && track.bodyKeys.length > 0)).toBe(true);
  });

  it("keeps Daily Teaching preferences and delivery history in MySQL", () => {
    expect(schema).toMatch(/mysqlTable\(\s*"daily_teachings"/);
    expect(schema).toMatch(/mysqlTable\(\s*"daily_teaching_preferences"/);
    expect(schema).toMatch(/mysqlTable\(\s*"daily_teaching_deliveries"/);
    expect(schema).toContain('mysqlEnum("frequency", ["off", "daily", "weekly"]');
  });

  it("synchronizes Daily Teachings before Railway starts and exposes both member experiences", () => {
    expect(railway.deploy.preDeployCommand[0]).toContain("pnpm daily:sync");
    expect(home).toContain("<DailyTeachingPromo />");
    expect(home).toContain("Susan’s Healing Music");
    expect(app).toContain('/daily-teachings/:slug');
    expect(app).toContain('/music');
  });

  it("allows mobile zoom and names every music action by track", () => {
    expect(html).not.toContain("maximum-scale=1");
    expect(musicPage).toContain('aria-label={`${active ? "Selected" : "Listen to"} ${track.title}`}');
  });
});
