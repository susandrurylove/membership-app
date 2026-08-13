import type { Express } from "express";
import multer from "multer";
import { authenticateMemberRequest } from "../auth";
import { registerMediaAsset } from "../adminData";
import { storagePut } from "../storage";

const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;
const acceptedMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      callback(new Error("This file type is not supported."));
      return;
    }
    callback(null, true);
  },
});

function mediaKind(mimeType: string): "video" | "audio" | "image" | "document" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  return "document";
}

function safeFilename(filename: string) {
  const normalized = filename
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 180) || "upload";
}

export function registerAdminMediaRoutes(app: Express) {
  app.post("/api/admin/media/upload", (req, res) => {
    upload.single("file")(req, res, async error => {
      if (error) {
        const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({
          error: error instanceof Error ? error.message : "The upload could not be processed.",
        });
      }

      try {
        const auth = await authenticateMemberRequest(req);
        if (!auth?.user || auth.user.role !== "admin" || auth.user.accountStatus === "suspended") {
          return res.status(403).json({ error: "Administrator access is required." });
        }
        if (!req.file) return res.status(400).json({ error: "Choose a file to upload." });

        const kind = mediaKind(req.file.mimetype);
        const filename = safeFilename(req.file.originalname);
        const uploaded = await storagePut(
          `membership/${kind}/${Date.now()}-${filename}`,
          req.file.buffer,
          req.file.mimetype
        );
        const asset = await registerMediaAsset({
          actorUserId: auth.user.id,
          kind,
          storageKey: uploaded.key,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          byteSize: req.file.size,
          altText: typeof req.body.altText === "string" ? req.body.altText.trim().slice(0, 500) : null,
        });

        return res.status(201).json({ asset });
      } catch (uploadError) {
        console.error("[Admin Media] Upload failed", uploadError);
        return res.status(500).json({ error: "The file could not be stored. Please try again." });
      }
    });
  });
}

