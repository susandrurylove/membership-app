import type { Express, Request } from "express";
import { exchangeSsoCode } from "../sso";

const attempts = new Map<string, { count: number; resetAt: number }>();

function getBasicCredentials(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 1) return null;
    return { clientId: decoded.slice(0, separator), clientSecret: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

export function registerSsoRoutes(app: Express) {
  app.post("/api/sso/exchange", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const credentials = getBasicCredentials(req);
    const rateKey = `${req.ip}:${credentials?.clientId || "unknown"}`;
    if (isRateLimited(rateKey)) {
      return res.status(429).json({
        error: "rate_limited",
        error_description: "The launch authorization could not be completed.",
      });
    }

    if (!credentials) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Susan Drury Membership SSO"');
      return res.status(401).json({
        error: "invalid_client",
        error_description: "The launch authorization could not be completed.",
      });
    }

    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (code.length < 32 || code.length > 256) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "The launch authorization could not be completed.",
      });
    }

    try {
      const result = await exchangeSsoCode({ code, ...credentials });
      if ("error" in result) {
        const status = result.error === "invalid_client" ? 401 : 400;
        return res.status(status).json({
          error: result.error,
          error_description: "The launch authorization could not be completed.",
        });
      }

      return res.status(200).json({
        access_token: result.accessToken,
        token_type: "Bearer",
        expires_in: result.expiresIn,
      });
    } catch {
      return res.status(503).json({
        error: "temporarily_unavailable",
        error_description: "The launch authorization could not be completed.",
      });
    }
  });
}

