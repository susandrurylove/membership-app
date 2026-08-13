import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";
import { authenticateMemberRequest, canAccessPortal } from "../auth";
import { decodeStorageKey, fetchStoredObject } from "../storage";

const FORWARDED_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

async function serveMemberMedia(req: Request, res: Response) {
  try {
    const auth = await authenticateMemberRequest(req);
    if (!auth || !canAccessPortal(auth.user, auth.membership)) {
      return res.status(403).json({ error: "An active membership is required." });
    }

    const key = decodeStorageKey(req.params.encodedKey);
    if (!key.startsWith("membership/")) {
      return res.status(404).json({ error: "Media not found." });
    }

    const upstream = await fetchStoredObject(key, req.headers.range);
    if (!upstream.ok && upstream.status !== 206) {
      if (upstream.status === 404) return res.status(404).json({ error: "Media not found." });
      throw new Error(`Bunny storage read failed (${upstream.status})`);
    }

    res.status(upstream.status);
    res.setHeader("Cache-Control", "private, no-store");
    for (const header of FORWARDED_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    if (!upstream.body || req.method === "HEAD") return res.end();
    Readable.fromWeb(upstream.body as never).pipe(res);
  } catch (error) {
    console.error("[Member Media] Delivery failed", error);
    return res.status(500).json({ error: "The media could not be delivered." });
  }
}

export function registerMemberMediaRoutes(app: Express) {
  app.get("/api/member/media/:encodedKey", serveMemberMedia);
  app.head("/api/member/media/:encodedKey", serveMemberMedia);
}
