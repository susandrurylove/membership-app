import type { Express, Request, Response } from "express";
const BUNNY_CDN_ORIGIN = "https://membership-susan.b-cdn.net";
const SAFE_PATH = /^(teachings|portal)\/v2\/[a-z0-9-]+\.webp$/;

function getSafeAssetPath(req: Request): string | null {
  const assetPath = `${req.params.collection}/v2/${req.params.filename}`;
  return SAFE_PATH.test(assetPath) ? assetPath : null;
}

export function registerPublicBunnyImageRoutes(app: Express) {
  app.get("/api/public/images/:collection/v2/:filename", async (req: Request, res: Response) => {
    const assetPath = getSafeAssetPath(req);
    if (!assetPath) return res.status(404).end();

    try {
      const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT?.replace(/\/$/, "");
      const storageZone = process.env.BUNNY_STORAGE_ZONE;
      const storageKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
      const storageRoot = storageEndpoint && storageZone
        ? storageEndpoint.endsWith(`/${storageZone}`) ? storageEndpoint : `${storageEndpoint}/${storageZone}`
        : null;
      const upstreamUrl = storageRoot && storageKey
        ? `${storageRoot}/${assetPath}`
        : `${BUNNY_CDN_ORIGIN}/${assetPath}`;
      const headers: Record<string, string> = { Accept: "image/webp" };
      if (storageKey && storageRoot) headers.AccessKey = storageKey;

      const upstream = await fetch(upstreamUrl, {
        headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (!upstream.ok) return res.status(502).end();

      const body = Buffer.from(await upstream.arrayBuffer());
      res.status(200);
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Content-Length", String(body.length));
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(body);
    } catch {
      if (!res.headersSent) res.status(502).end();
    }
  });
}
