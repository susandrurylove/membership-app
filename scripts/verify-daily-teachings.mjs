import fs from "node:fs";
import path from "node:path";

const seedPath = path.join(process.cwd(), "content", "seed", "daily-teachings.json");
const library = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const teachings = library.teachings;
if (!Array.isArray(teachings) || teachings.length !== 365) throw new Error(`Expected 365 Daily Teachings, found ${teachings?.length ?? 0}`);

const keys = new Set();
const slugs = new Set();
const sequences = new Set();
const images = new Set();
const sourceCounts = {};
let maximumWordCount = 0;
for (const item of teachings) {
  for (const field of ["sequence", "sourceKey", "sourceType", "sourceTitle", "collection", "slug", "title", "summary", "bodyMarkdown", "reflectionPrompt", "practice", "sourceNote", "imageUrl", "imageAlt", "totalWordCount"]) {
    if (item[field] === undefined || item[field] === null || String(item[field]).trim() === "") throw new Error(`${item.sourceKey || item.slug}: missing ${field}`);
  }
  if (!Number.isInteger(item.totalWordCount) || item.totalWordCount > 400) throw new Error(`${item.sourceKey}: exceeds 400 words`);
  if (!/^https:\/\/membership-susan\.b-cdn\.net\/.+\.webp$/.test(item.imageUrl)) throw new Error(`${item.sourceKey}: invalid membership Bunny WebP URL`);
  if (keys.has(item.sourceKey) || slugs.has(item.slug) || sequences.has(item.sequence) || images.has(item.imageUrl)) throw new Error(`${item.sourceKey}: duplicate key, slug, sequence, or image`);
  keys.add(item.sourceKey);
  slugs.add(item.slug);
  sequences.add(item.sequence);
  images.add(item.imageUrl);
  sourceCounts[item.sourceType] = (sourceCounts[item.sourceType] || 0) + 1;
  maximumWordCount = Math.max(maximumWordCount, item.totalWordCount);
}
for (let sequence = 1; sequence <= 365; sequence++) if (!sequences.has(sequence)) throw new Error(`Missing Daily Teaching sequence ${sequence}`);
console.log(JSON.stringify({ status: "verified", count: teachings.length, maximumWordCount, uniqueImages: images.size, sourceCounts }));
