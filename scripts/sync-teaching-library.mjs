import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const libraryPath = path.join(root, "content", "seed", "teaching-library.json");
const dryRun = process.argv.includes("--dry-run");
if (!dryRun && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to synchronize the teaching library");
if (!fs.existsSync(libraryPath)) throw new Error(`Teaching library not found: ${libraryPath}`);

const raw = fs.readFileSync(libraryPath, "utf8");
const library = JSON.parse(raw);
if (!Array.isArray(library.teachings) || library.teachings.length < 1) throw new Error("Teaching library is empty");
if (library.architecture?.database !== "MySQL" || library.architecture?.media !== "Bunny") {
  throw new Error("Teaching library architecture must remain MySQL + Bunny");
}

const version = crypto.createHash("sha256").update(raw).digest("hex");
const categories = [
  { name: "Begin Here", slug: "begin-here", description: "Foundations and gentle first steps for the Elevate to Love journey.", sortOrder: 10 },
  { name: "Embodied Wisdom", slug: "embodied-wisdom", description: "Body systems, Body Cards, and compassionate embodied self-inquiry.", sortOrder: 20 },
  { name: "Origins & Inner Patterns", slug: "origins-inner-patterns", description: "Explore early patterning, the nervous system, and the stories carried from our beginnings.", sortOrder: 30 },
  { name: "Transformation & Healing", slug: "transformation-healing", description: "Teachings and practices for meeting life with compassion, awareness, and new possibility.", sortOrder: 40 },
  { name: "Relationships & Love", slug: "relationships-love", description: "Reflections for partnership, family patterns, judgment, belonging, and love.", sortOrder: 50 },
  { name: "Tao & Timeless Wisdom", slug: "tao-timeless-wisdom", description: "Ancient wisdom translated into contemplative practice for modern life.", sortOrder: 60 },
  { name: "Meditation & Sacred Practice", slug: "meditation-sacred-practice", description: "Breath, stillness, visualization, journaling, and repeatable sacred practices.", sortOrder: 70 },
  { name: "Susan’s Reflections", slug: "susans-reflections", description: "Current essays, lived stories, and timely reflections from Susan.", sortOrder: 80 },
  { name: "Therapeutic Perspectives", slug: "therapeutic-perspectives", description: "Educational perspectives on healing modalities, presented without diagnosis or treatment claims.", sortOrder: 90 },
];
const categoryByName = new Map(categories.map(category => [category.name, category]));

for (const teaching of library.teachings) {
  if (!teaching.sourceKey || !teaching.slug || !teaching.title || !teaching.collection || !teaching.bodyMarkdown) {
    throw new Error(`Invalid teaching record: ${teaching.slug || teaching.sourceKey || "unknown"}`);
  }
  if (!categoryByName.has(teaching.collection)) throw new Error(`Unknown collection: ${teaching.collection}`);
  if (teaching.heroImageUrl && !/^https:\/\/(?:[^/]+\.)?b-cdn\.net\//.test(teaching.heroImageUrl)) {
    throw new Error(`Non-Bunny hero image rejected for ${teaching.slug}`);
  }
}

if (dryRun) {
  console.log(JSON.stringify({ status: "validated", version, recordCount: library.teachings.length, categories: categories.length }));
  process.exit(0);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [existingImports] = await connection.execute("SELECT id FROM content_imports WHERE version = ? LIMIT 1", [version]);
  if (Array.isArray(existingImports) && existingImports.length > 0) {
    console.log(JSON.stringify({ status: "already-current", version, recordCount: library.teachings.length }));
    process.exit(0);
  }

  await connection.beginTransaction();
  try {
    for (const category of categories) {
      await connection.execute(
        `INSERT INTO content_categories (name, slug, description, sortOrder)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder)`,
        [category.name, category.slug, category.description, category.sortOrder]
      );
    }

    const [categoryRows] = await connection.execute("SELECT id, slug FROM content_categories");
    const categoryIds = new Map(categoryRows.map(row => [row.slug, row.id]));
    let createdOrUpdated = 0;

    for (const teaching of library.teachings) {
      const category = categoryByName.get(teaching.collection);
      const categoryId = categoryIds.get(category.slug);
      if (!categoryId) throw new Error(`Missing category id for ${category.slug}`);
      const contentHash = crypto.createHash("sha256").update(JSON.stringify(teaching)).digest("hex");
      const publishedAt = teaching.sourcePublishedAt ? new Date(`${teaching.sourcePublishedAt}T12:00:00Z`) : new Date();
      await connection.execute(
        `INSERT INTO teachings (
          categoryId, title, slug, summary, body, contentType, status, featured, sortOrder, publishedAt,
          sourceKey, sourceType, sourceUrl, sourceTitle, sourceLocator, sourceYear, sourcePublishedAt,
          readingMinutes, keyThemes, reflectionPrompts, practiceInvitation, sensitiveContentNotes,
          medicalDisclaimer, sourceCategories, heroImageUrl, contentHash, importedAt
        ) VALUES (?, ?, ?, ?, ?, 'text', 'published', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          categoryId = VALUES(categoryId), title = VALUES(title), slug = VALUES(slug), summary = VALUES(summary),
          body = VALUES(body), contentType = VALUES(contentType), status = VALUES(status), featured = VALUES(featured),
          sortOrder = VALUES(sortOrder), publishedAt = VALUES(publishedAt), sourceKey = VALUES(sourceKey),
          sourceType = VALUES(sourceType), sourceUrl = VALUES(sourceUrl), sourceTitle = VALUES(sourceTitle),
          sourceLocator = VALUES(sourceLocator), sourceYear = VALUES(sourceYear), sourcePublishedAt = VALUES(sourcePublishedAt),
          readingMinutes = VALUES(readingMinutes), keyThemes = VALUES(keyThemes), reflectionPrompts = VALUES(reflectionPrompts),
          practiceInvitation = VALUES(practiceInvitation), sensitiveContentNotes = VALUES(sensitiveContentNotes),
          medicalDisclaimer = VALUES(medicalDisclaimer), sourceCategories = VALUES(sourceCategories),
          heroImageUrl = VALUES(heroImageUrl), contentHash = VALUES(contentHash), importedAt = NOW()`,
        [
          categoryId,
          teaching.title,
          teaching.slug,
          teaching.summary,
          teaching.bodyMarkdown,
          teaching.featured ? 1 : 0,
          teaching.sortOrder ?? 0,
          publishedAt,
          teaching.sourceKey,
          teaching.sourceType,
          teaching.sourceUrl ?? null,
          teaching.sourceTitle,
          teaching.sourceLocator,
          teaching.sourceYear ?? null,
          teaching.sourcePublishedAt ? new Date(`${teaching.sourcePublishedAt}T12:00:00Z`) : null,
          teaching.readingMinutes ?? null,
          JSON.stringify(teaching.keyThemes ?? []),
          JSON.stringify(teaching.reflectionPrompts ?? []),
          teaching.practiceInvitation ?? null,
          JSON.stringify(teaching.sensitiveContentNotes ?? []),
          teaching.medicalDisclaimer ? 1 : 0,
          JSON.stringify(teaching.sourceCategories ?? []),
          teaching.heroImageUrl ?? null,
          contentHash,
        ]
      );
      createdOrUpdated += 1;
    }

    await connection.execute(
      "INSERT INTO content_imports (version, recordCount, sourceSummary) VALUES (?, ?, ?)",
      [version, library.teachings.length, `${library.publicationTeachings} publication teachings + ${library.websiteTeachings} official website articles`]
    );
    await connection.commit();
    console.log(JSON.stringify({ status: "synchronized", version, recordCount: createdOrUpdated }));
  } catch (error) {
    await connection.rollback();
    throw error;
  }
} finally {
  await connection.end();
}
