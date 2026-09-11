import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "content", "seed", "healing-music.json");
const library = JSON.parse(fs.readFileSync(file, "utf8"));
if (library.provider !== "Bunny" || library.storageZone !== "susan-website") throw new Error("Healing Music must remain on Susan’s Bunny storage zone");
if (!Array.isArray(library.tracks) || library.tracks.length !== 23) throw new Error(`Expected 23 Healing Music tracks; found ${library.tracks?.length ?? 0}`);
const slugs = new Set();
const urls = new Set();
for (const track of library.tracks) {
  for (const field of ["order", "title", "slug", "webRemotePath", "webUrl", "durationSeconds", "webBytes", "mimeType", "artist", "album"]) {
    if (track[field] === undefined || track[field] === null || String(track[field]).trim() === "") throw new Error(`${track.slug || "unknown"}: missing ${field}`);
  }
  if (!Array.isArray(track.bodyKeys) || !track.bodyKeys.length) throw new Error(`${track.slug}: missing body-system mapping`);
  if (!/^https:\/\/susan-website-pull\.b-cdn\.net\/healing-music\/v1\/mp3\/[a-z0-9-]+\.mp3$/.test(track.webUrl)) throw new Error(`${track.slug}: invalid Susan Bunny MP3 URL`);
  if (track.mimeType !== "audio/mpeg" || track.durationSeconds < 120 || track.webBytes < 1_000_000) throw new Error(`${track.slug}: invalid web-audio metadata`);
  if (slugs.has(track.slug) || urls.has(track.webUrl)) throw new Error(`${track.slug}: duplicate slug or URL`);
  if ("masterFilename" in track || "masterLocalPath" in track || "webLocalPath" in track) throw new Error(`${track.slug}: private authoring path leaked into public catalog`);
  slugs.add(track.slug);
  urls.add(track.webUrl);
}
console.log(JSON.stringify({ status: "verified", tracks: library.tracks.length, uniqueUrls: urls.size, bodyMappings: library.tracks.reduce((total, track) => total + track.bodyKeys.length, 0) }));
