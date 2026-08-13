import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Railway migration configuration", () => {
  it("uses the committed Drizzle folder containing the journal and migrations", () => {
    const projectRoot = resolve(import.meta.dirname, "..");
    const migrationScript = readFileSync(resolve(projectRoot, "scripts/migrate.mjs"), "utf8");
    const drizzleDir = resolve(projectRoot, "drizzle");

    expect(migrationScript).toContain('migrationsFolder: "./drizzle"');
    expect(existsSync(resolve(drizzleDir, "meta/_journal.json"))).toBe(true);
    expect(readdirSync(drizzleDir).some(file => file.endsWith(".sql"))).toBe(true);
  });
});
