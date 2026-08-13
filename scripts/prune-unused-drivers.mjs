import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const unusedAdapter = join(projectRoot, "node_modules", "drizzle-orm", "tidb-serverless");

await rm(unusedAdapter, { recursive: true, force: true });
