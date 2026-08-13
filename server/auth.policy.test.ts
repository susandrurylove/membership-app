import { describe, expect, it } from "vitest";
import type { Membership, User } from "../drizzle/schema";
import {
  canAccessPortal,
  hashPassword,
  isMembershipActive,
  normalizeEmail,
  verifyPassword,
} from "./auth";

const now = new Date("2026-08-13T12:00:00.000Z");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "local_test_user",
    name: "Portal Member",
    email: "member@example.com",
    loginMethod: "password",
    passwordHash: null,
    accountStatus: "active",
    role: "user",
    invitationAcceptedAt: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    ...overrides,
  };
}

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 1,
    userId: 1,
    tier: "silver",
    status: "active",
    source: "manual",
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    endsAt: new Date("2027-01-01T00:00:00.000Z"),
    graceEndsAt: null,
    externalCustomerId: null,
    externalSubscriptionId: null,
    externalProductId: null,
    internalNotes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("password security", () => {
  it("normalizes email addresses consistently", () => {
    expect(normalizeEmail("  MEMBER@Example.COM ")).toBe("member@example.com");
  });

  it("hashes and verifies a password without storing the raw value", async () => {
    const password = "A-long-private-passphrase-7";
    const encoded = await hashPassword(password);

    expect(encoded).not.toContain(password);
    expect(encoded.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword("Wrong-password-4", encoded)).resolves.toBe(false);
  });
});

describe("portal authorization policy", () => {
  it("allows an active account with a current active membership", () => {
    expect(isMembershipActive(makeMembership(), now)).toBe(true);
    expect(canAccessPortal(makeUser(), makeMembership())).toBe(true);
  });

  it("denies paused, expired, future, and cancelled memberships", () => {
    expect(canAccessPortal(makeUser(), makeMembership({ status: "paused" }))).toBe(false);
    expect(canAccessPortal(makeUser(), makeMembership({ status: "cancelled" }))).toBe(false);
    expect(canAccessPortal(makeUser(), makeMembership({ endsAt: new Date("2025-01-01") }))).toBe(false);
    expect(canAccessPortal(makeUser(), makeMembership({ startsAt: new Date("2030-01-01") }))).toBe(false);
  });

  it("allows an active administrator without a membership but denies a suspended administrator", () => {
    expect(canAccessPortal(makeUser({ role: "admin" }), null)).toBe(true);
    expect(canAccessPortal(makeUser({ role: "admin", accountStatus: "suspended" }), null)).toBe(false);
  });
});

