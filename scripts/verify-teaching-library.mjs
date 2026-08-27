import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryPath = path.join(root, "content", "seed", "teaching-library.json");
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
const allowedCollections = new Set([
  "Begin Here",
  "Embodied Wisdom",
  "Origins & Inner Patterns",
  "Transformation & Healing",
  "Relationships & Love",
  "Tao & Timeless Wisdom",
  "Meditation & Sacred Practice",
  "Susan’s Reflections",
  "Therapeutic Perspectives",
]);
const expectedArchitecture = {
  sourceControl: "GitHub",
  deployment: "Railway",
  database: "MySQL",
  media: "Bunny",
};

const issues = [];
const sourceKeys = new Set();
const slugs = new Set();
const teachings = Array.isArray(library.teachings) ? library.teachings : [];

if (library.totalTeachings !== 287 || teachings.length !== 287) issues.push(`Expected 287 teachings; found ${teachings.length}`);
if (library.publicationTeachings !== 90) issues.push(`Expected 90 publication teachings; found ${library.publicationTeachings}`);
if (library.websiteTeachings !== 197) issues.push(`Expected 197 website teachings; found ${library.websiteTeachings}`);
if (JSON.stringify(library.architecture) !== JSON.stringify(expectedArchitecture)) issues.push("Production architecture declaration changed");

for (const item of teachings) {
  if (!item.sourceKey || sourceKeys.has(item.sourceKey)) issues.push(`${item.slug}: missing or duplicate sourceKey`);
  sourceKeys.add(item.sourceKey);
  if (!item.slug || slugs.has(item.slug)) issues.push(`${item.slug}: missing or duplicate slug`);
  slugs.add(item.slug);
  if (!item.title || !item.summary || !item.bodyMarkdown) issues.push(`${item.slug}: missing required teaching content`);
  if (!allowedCollections.has(item.collection)) issues.push(`${item.slug}: invalid collection ${item.collection}`);
  if (!Array.isArray(item.keyThemes) || item.keyThemes.length < 3) issues.push(`${item.slug}: insufficient keyThemes`);
  if (!Array.isArray(item.reflectionPrompts) || item.reflectionPrompts.length !== 3) issues.push(`${item.slug}: expected exactly three reflectionPrompts`);
  if (!item.practiceInvitation || item.practiceInvitation.length < 60) issues.push(`${item.slug}: missing or short practiceInvitation`);
  if (item.sourceType === "website" && !item.sourceUrl?.startsWith("https://susandrury.com/blog/")) issues.push(`${item.slug}: invalid website provenance`);
  if (item.heroImageUrl && !/^https:\/\/(?:[^/]+\.)?b-cdn\.net\//.test(item.heroImageUrl)) issues.push(`${item.slug}: non-Bunny hero image`);
}

const serialized = JSON.stringify(library);
if (/manus.?cdn|tidb/i.test(serialized)) issues.push("Disallowed infrastructure reference found in production library");

const summary = {
  totalTeachings: teachings.length,
  publicationTeachings: library.publicationTeachings,
  websiteTeachings: library.websiteTeachings,
  uniqueSourceKeys: sourceKeys.size,
  uniqueSlugs: slugs.size,
  bunnyHeroImages: teachings.filter(item => item.heroImageUrl).length,
  collections: Object.fromEntries([...allowedCollections].map(collection => [collection, teachings.filter(item => item.collection === collection).length])),
  issueCount: issues.length,
  issues,
};
console.log(JSON.stringify(summary, null, 2));
if (issues.length) process.exitCode = 1;
