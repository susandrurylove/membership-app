import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decodeStorageKey,
  encodeStorageKey,
  protectedMediaUrl,
  storagePut,
} from "./storage";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Bunny media storage", () => {
  it("round-trips protected storage keys without exposing the path", () => {
    const key = "membership/video/lesson-intro-abc123.mp4";
    const encoded = encodeStorageKey(key);

    expect(encoded).not.toContain("/");
    expect(decodeStorageKey(encoded)).toBe(key);
    expect(protectedMediaUrl(key)).toBe(`/api/member/media/${encoded}`);
  });

  it("rejects path traversal keys", () => {
    const encoded = Buffer.from("membership/../private.txt", "utf8").toString("base64url");
    expect(() => decodeStorageKey(encoded)).toThrow("Invalid storage key");
  });

  it("fails closed when the Bunny storage key is absent", async () => {
    vi.stubEnv("BUNNY_STORAGE_ACCESS_KEY", "");
    await expect(storagePut("membership/image/test.webp", "test", "image/webp"))
      .rejects.toThrow("BUNNY_STORAGE_ACCESS_KEY is not configured");
  });
});
