import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const seedPath = path.join(root, "content", "seed", "daily-teachings.json");
const dryRun = process.argv.includes("--dry-run");
if (!dryRun && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to synchronize Daily Teachings");
if (!fs.existsSync(seedPath)) throw new Error(`Daily Teaching seed not found: ${seedPath}`);

const raw = fs.readFileSync(seedPath, "utf8");
const library = JSON.parse(raw);
if (!Array.isArray(library.teachings) || library.teachings.length !== 365) {
  throw new Error(`Daily Teaching library must contain exactly 365 records; found ${library.teachings?.length ?? 0}`);
}

const sourceKeys = new Set();
const slugs = new Set();
const sequences = new Set();
const imageUrls = new Set();
for (const teaching of library.teachings) {
  for (const field of ["sequence", "sourceKey", "sourceType", "sourceTitle", "collection", "slug", "title", "summary", "bodyMarkdown", "reflectionPrompt", "practice", "sourceNote", "imageUrl", "imageAlt", "totalWordCount"]) {
    if (teaching[field] === undefined || teaching[field] === null || String(teaching[field]).trim() === "") {
      throw new Error(`${teaching.sourceKey || teaching.slug || "unknown"}: missing ${field}`);
    }
  }
  if (!Number.isInteger(teaching.sequence) || teaching.sequence < 1 || teaching.sequence > 365) throw new Error(`${teaching.sourceKey}: invalid sequence`);
  if (!Number.isInteger(teaching.totalWordCount) || teaching.totalWordCount < 1 || teaching.totalWordCount > 400) throw new Error(`${teaching.sourceKey}: invalid word count ${teaching.totalWordCount}`);
  if (!/^https:\/\/membership-susan\.b-cdn\.net\//.test(teaching.imageUrl)) throw new Error(`${teaching.sourceKey}: image must use the membership Bunny zone`);
  if (sourceKeys.has(teaching.sourceKey) || slugs.has(teaching.slug) || sequences.has(teaching.sequence) || imageUrls.has(teaching.imageUrl)) {
    throw new Error(`${teaching.sourceKey}: duplicate source key, slug, sequence, or image URL`);
  }
  sourceKeys.add(teaching.sourceKey);
  slugs.add(teaching.slug);
  sequences.add(teaching.sequence);
  imageUrls.add(teaching.imageUrl);
}

const version = crypto.createHash("sha256").update(`daily-teachings:${raw}`).digest("hex");
if (dryRun) {
  console.log(JSON.stringify({ status: "validated", version, recordCount: 365, uniqueImages: imageUrls.size }));
  process.exit(0);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [existingImports] = await connection.execute("SELECT id FROM content_imports WHERE version = ? LIMIT 1", [version]);
  if (Array.isArray(existingImports) && existingImports.length > 0) {
    console.log(JSON.stringify({ status: "already-current", version, recordCount: 365 }));
    process.exit(0);
  }

  await connection.beginTransaction();
  try {
    for (const teaching of library.teachings) {
      const contentHash = crypto.createHash("sha256").update(JSON.stringify(teaching)).digest("hex");
      await connection.execute(
        `INSERT INTO daily_teachings (
          sequence, sourceKey, sourceType, sourceTitle, sourceLocator, sourceUrl, existingTeachingSlug,
          collection, slug, title, summary, body, reflectionPrompt, practice, sourceNote, safetyNote,
          medicalDisclaimer, imageUrl, imageAlt, totalWordCount, contentHash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
        ON DUPLICATE KEY UPDATE
          sequence = VALUES(sequence), sourceType = VALUES(sourceType), sourceTitle = VALUES(sourceTitle),
          sourceLocator = VALUES(sourceLocator), sourceUrl = VALUES(sourceUrl), existingTeachingSlug = VALUES(existingTeachingSlug),
          collection = VALUES(collection), slug = VALUES(slug), title = VALUES(title), summary = VALUES(summary),
          body = VALUES(body), reflectionPrompt = VALUES(reflectionPrompt), practice = VALUES(practice),
          sourceNote = VALUES(sourceNote), safetyNote = VALUES(safetyNote), medicalDisclaimer = VALUES(medicalDisclaimer),
          imageUrl = VALUES(imageUrl), imageAlt = VALUES(imageAlt), totalWordCount = VALUES(totalWordCount),
          contentHash = VALUES(contentHash), status = 'published', updatedAt = NOW()`,
        [
          teaching.sequence,
          teaching.sourceKey,
          teaching.sourceType,
          teaching.sourceTitle,
          teaching.sourceLocator ?? null,
          teaching.sourceUrl ?? null,
          teaching.existingTeachingSlug ?? null,
          teaching.collection,
          teaching.slug,
          teaching.title,
          teaching.summary,
          teaching.bodyMarkdown,
          teaching.reflectionPrompt,
          teaching.practice,
          teaching.sourceNote,
          teaching.safetyNote ?? null,
          teaching.medicalDisclaimer ? 1 : 0,
          teaching.imageUrl,
          teaching.imageAlt,
          teaching.totalWordCount,
          contentHash,
        ]
      );
    }
    await connection.execute(
      "INSERT INTO content_imports (version, recordCount, sourceSummary) VALUES (?, ?, ?)",
      [version, 365, "365 concise Daily Teachings from SusanDrury.com, supplied books, booklet, and Elevated Body cards"]
    );
    await connection.commit();
    console.log(JSON.stringify({ status: "synchronized", version, recordCount: 365 }));
  } catch (error) {
    await connection.rollback();
    throw error;
  }
} finally {
  await connection.end();
}
