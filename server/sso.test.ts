import { afterEach, describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import { createSsoAssertion, getIntegrationConfigs, listIntegrationStatus, safeSecretEqual } from "./sso";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("external app SSO configuration", () => {
  it("does not expose client identifiers or secrets in member-visible status", () => {
    process.env.ELEVATE_SSO_ENABLED = "true";
    process.env.ELEVATE_SSO_LAUNCH_URL = "https://example.com/sso/callback";
    process.env.ELEVATE_SSO_CLIENT_ID = "private-client-id";
    process.env.ELEVATE_SSO_CLIENT_SECRET = "private-client-secret";
    process.env.ELEVATE_SSO_AUDIENCE = "elevate-audience";

    const status = listIntegrationStatus().find(item => item.key === "elevate");
    expect(status?.enabled).toBe(true);
    expect(JSON.stringify(status)).not.toContain("private-client-id");
    expect(JSON.stringify(status)).not.toContain("private-client-secret");
  });

  it("keeps an integration disabled until every confidential input is present", () => {
    process.env.TAO_SSO_ENABLED = "true";
    process.env.TAO_SSO_LAUNCH_URL = "https://tao.example/sso/callback";
    delete process.env.TAO_SSO_CLIENT_SECRET;

    expect(getIntegrationConfigs().tao.enabled).toBe(false);
  });

  it("compares destination secrets without exposing early string differences", () => {
    expect(safeSecretEqual("correct-secret", "correct-secret")).toBe(true);
    expect(safeSecretEqual("wrong-secret", "correct-secret")).toBe(false);
  });

  it("issues a short-lived audience-bound assertion with only approved member claims", async () => {
    const clientSecret = "destination-secret-with-sufficient-entropy";
    const accessToken = await createSsoAssertion({
      clientSecret,
      audience: "elevate-to-love",
      userId: 42,
      email: "member@example.com",
      name: "Portal Member",
      membershipTier: "gold",
      ttlSeconds: 120,
      issuer: "https://membership.susandrury.com",
    });

    const { payload, protectedHeader } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(clientSecret),
      {
        issuer: "https://membership.susandrury.com",
        audience: "elevate-to-love",
        algorithms: ["HS256"],
      }
    );

    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe("member:42");
    expect(payload.email).toBe("member@example.com");
    expect(payload.name).toBe("Portal Member");
    expect(payload.membership_tier).toBe("gold");
    expect(payload.jti).toEqual(expect.any(String));
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(120);
    expect(payload).not.toHaveProperty("passwordHash");
    expect(payload).not.toHaveProperty("role");
  });
});
