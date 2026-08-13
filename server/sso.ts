import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { SignJWT } from "jose";
import {
  memberActivities,
  memberships,
  ssoLaunchGrants,
  users,
} from "../drizzle/schema";
import { canAccessPortal } from "./auth";
import { getDb } from "./db";

export const appKeys = ["elevate", "enlightened_body", "tao"] as const;
export type AppKey = (typeof appKeys)[number];

type IntegrationConfig = {
  key: AppKey;
  title: string;
  eyebrow: string;
  description: string;
  enabled: boolean;
  launchUrl: string;
  clientId: string;
  clientSecret: string;
  audience: string;
};

function envEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function makeConfig(input: Omit<IntegrationConfig, "enabled"> & { enabledFlag: string | undefined }) {
  const configured = Boolean(input.launchUrl && input.clientId && input.clientSecret && input.audience);
  return {
    key: input.key,
    title: input.title,
    eyebrow: input.eyebrow,
    description: input.description,
    launchUrl: input.launchUrl,
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    audience: input.audience,
    enabled: envEnabled(input.enabledFlag) && configured,
  } satisfies IntegrationConfig;
}

export function getIntegrationConfigs(): Record<AppKey, IntegrationConfig> {
  return {
    elevate: makeConfig({
      key: "elevate",
      title: "Elevate To Love",
      eyebrow: "Oracle and daily guidance",
      description: "Draw from Susan’s realms of insight and carry her guidance into the rhythm of your day.",
      enabledFlag: process.env.ELEVATE_SSO_ENABLED,
      launchUrl: process.env.ELEVATE_SSO_LAUNCH_URL || "",
      clientId: process.env.ELEVATE_SSO_CLIENT_ID || "",
      clientSecret: process.env.ELEVATE_SSO_CLIENT_SECRET || "",
      audience: process.env.ELEVATE_SSO_AUDIENCE || "elevate-to-love",
    }),
    enlightened_body: makeConfig({
      key: "enlightened_body",
      title: "Enlightened Body",
      eyebrow: "Embodied healing",
      description: "Enter a compassionate dialogue with the wisdom held throughout your body.",
      enabledFlag: process.env.ENLIGHTENED_BODY_SSO_ENABLED,
      launchUrl: process.env.ENLIGHTENED_BODY_SSO_LAUNCH_URL || "",
      clientId: process.env.ENLIGHTENED_BODY_SSO_CLIENT_ID || "",
      clientSecret: process.env.ENLIGHTENED_BODY_SSO_CLIENT_SECRET || "",
      audience: process.env.ENLIGHTENED_BODY_SSO_AUDIENCE || "enlightened-body",
    }),
    tao: makeConfig({
      key: "tao",
      title: "Tao Interactive",
      eyebrow: "Interactive wisdom",
      description: "Enter Susan’s interactive Tao experience through your private member access.",
      enabledFlag: process.env.TAO_SSO_ENABLED,
      launchUrl: process.env.TAO_SSO_LAUNCH_URL || "",
      clientId: process.env.TAO_SSO_CLIENT_ID || "",
      clientSecret: process.env.TAO_SSO_CLIENT_SECRET || "",
      audience: process.env.TAO_SSO_AUDIENCE || "tao-interactive",
    }),
  };
}

export function listIntegrationStatus() {
  return Object.values(getIntegrationConfigs()).map(config => ({
    key: config.key,
    title: config.title,
    eyebrow: config.eyebrow,
    description: config.description,
    enabled: config.enabled,
  }));
}

export function safeSecretEqual(actual: string, expected: string) {
  const left = createHash("sha256").update(actual).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function codeHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function createSsoLaunch(userId: number, appKey: AppKey) {
  const config = getIntegrationConfigs()[appKey];
  if (!config.enabled) return null;

  const code = randomBytes(32).toString("base64url");
  const ttlSeconds = Math.min(180, Math.max(30, Number(process.env.SSO_CODE_TTL_SECONDS || 90)));
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const db = await requireDb();

  await db.insert(ssoLaunchGrants).values({
    userId,
    appKey,
    audience: config.audience,
    codeHash: codeHash(code),
    expiresAt,
  });

  const launch = new URL(config.launchUrl);
  launch.searchParams.set("code", code);
  launch.searchParams.set(
    "issuer",
    (process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "")
  );

  return { launchUrl: launch.toString(), expiresAt };
}

async function consumeSsoGrant(input: { code: string; appKey: AppKey; audience: string }) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const rows = await tx
      .select({ grant: ssoLaunchGrants, user: users, membership: memberships })
      .from(ssoLaunchGrants)
      .innerJoin(users, eq(ssoLaunchGrants.userId, users.id))
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .where(
        and(
          eq(ssoLaunchGrants.codeHash, codeHash(input.code)),
          eq(ssoLaunchGrants.appKey, input.appKey),
          eq(ssoLaunchGrants.audience, input.audience)
        )
      )
      .limit(1)
      .for("update");

    const row = rows[0];
    if (!row) return null;
    if (row.grant.consumedAt || row.grant.expiresAt <= new Date()) return null;
    if (!canAccessPortal(row.user, row.membership)) return null;

    const consumedAt = new Date();
    await tx
      .update(ssoLaunchGrants)
      .set({ consumedAt })
      .where(eq(ssoLaunchGrants.id, row.grant.id));
    await tx.insert(memberActivities).values({
      userId: row.user.id,
      type: "app_launched",
      entityType: "app",
      entityId: input.appKey,
      titleSnapshot: getIntegrationConfigs()[input.appKey].title,
      metadata: { audience: input.audience },
    });

    return row;
  });
}

export async function exchangeSsoCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
}) {
  const config = Object.values(getIntegrationConfigs()).find(
    candidate => candidate.enabled && candidate.clientId === input.clientId
  );
  if (!config || !safeSecretEqual(input.clientSecret, config.clientSecret)) {
    return { error: "invalid_client" as const };
  }

  const result = await consumeSsoGrant({
    code: input.code,
    appKey: config.key,
    audience: config.audience,
  });
  if (!result) return { error: "invalid_grant" as const };

  const ttlSeconds = Math.min(600, Math.max(60, Number(process.env.SSO_ASSERTION_TTL_SECONDS || 300)));
  const accessToken = await createSsoAssertion({
    clientSecret: config.clientSecret,
    audience: config.audience,
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name || "",
    membershipTier: result.membership?.tier || "custom",
    ttlSeconds,
  });

  return {
    accessToken,
    expiresIn: ttlSeconds,
    appKey: config.key,
  };
}

export async function createSsoAssertion(input: {
  clientSecret: string;
  audience: string;
  userId: number;
  email: string | null;
  name: string;
  membershipTier: string;
  ttlSeconds?: number;
  issuer?: string;
}) {
  const ttlSeconds = Math.min(600, Math.max(60, input.ttlSeconds ?? 300));
  const issuer = (input.issuer || process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  const secret = new TextEncoder().encode(input.clientSecret);
  return new SignJWT({
    email: input.email,
    name: input.name,
    membership_tier: input.membershipTier,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(input.audience)
    .setSubject(`member:${input.userId}`)
    .setJti(randomBytes(16).toString("base64url"))
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);
}
