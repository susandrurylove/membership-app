import { readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const drizzleRoot = join(projectRoot, "node_modules", "drizzle-orm");

for (const entry of await readdir(drizzleRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name.endsWith("-serverless")) {
    await rm(join(drizzleRoot, entry.name), { recursive: true, force: true });
  }
}
