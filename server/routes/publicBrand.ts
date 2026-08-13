import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { fetchStoredObject } from "../storage";

const PUBLIC_BRAND_FILES = new Set([
  "susan-drury-logo-48.webp",
  "susan-drury-logo-96.webp",
  "susan-drury-logo-160.webp",
  "susan-drury-logo-320.webp",
]);

async function serveBrandAsset(req: Request, res: Response) {
  const filename = req.params.filename;
  if (!PUBLIC_BRAND_FILES.has(filename)) {
    return res.status(404).json({ error: "Brand asset not found." });
  }

  try {
    const upstream = await fetchStoredObject(`branding/${filename}`);
    if (!upstream.ok) {
      if (upstream.status === 404) return res.status(404).json({ error: "Brand asset not found." });
      throw new Error(`Bunny storage read failed (${upstream.status})`);
    }

    res.status(200);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/webp");
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (!upstream.body || req.method === "HEAD") return res.end();
    Readable.fromWeb(upstream.body as never).pipe(res);
  } catch (error) {
    console.error("[Brand Asset] Delivery failed", error);
    return res.status(502).json({ error: "Brand asset is temporarily unavailable." });
  }
}

export function registerPublicBrandRoutes(app: Express) {
  app.get("/api/public/brand/:filename", serveBrandAsset);
  app.head("/api/public/brand/:filename", serveBrandAsset);
}
