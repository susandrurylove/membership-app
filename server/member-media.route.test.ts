import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateMemberRequest: vi.fn(),
  canAccessPortal: vi.fn(),
  decodeStorageKey: vi.fn(),
  fetchStoredObject: vi.fn(),
}));

vi.mock("./auth", () => ({
  authenticateMemberRequest: mocks.authenticateMemberRequest,
  canAccessPortal: mocks.canAccessPortal,
}));

vi.mock("./storage", () => ({
  decodeStorageKey: mocks.decodeStorageKey,
  fetchStoredObject: mocks.fetchStoredObject,
}));

import { registerMemberMediaRoutes } from "./routes/memberMedia";
import { registerPublicBrandRoutes } from "./routes/publicBrand";

function createApp() {
  const app = express();
  registerMemberMediaRoutes(app);
  return app;
}

function createBrandApp() {
  const app = express();
  registerPublicBrandRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.decodeStorageKey.mockReturnValue("membership/video/lesson-intro.mp4");
  mocks.canAccessPortal.mockReturnValue(true);
});

describe("protected Bunny member media route", () => {
  it("blocks unauthenticated requests before contacting Bunny", async () => {
    mocks.authenticateMemberRequest.mockResolvedValue(null);

    await request(createApp()).get("/api/member/media/encoded-key").expect(403);
    expect(mocks.fetchStoredObject).not.toHaveBeenCalled();
  });

  it("blocks authenticated requests without active portal access", async () => {
    mocks.authenticateMemberRequest.mockResolvedValue({ user: {}, membership: null });
    mocks.canAccessPortal.mockReturnValue(false);

    await request(createApp()).get("/api/member/media/encoded-key").expect(403);
    expect(mocks.fetchStoredObject).not.toHaveBeenCalled();
  });

  it("rejects storage keys outside the protected membership namespace", async () => {
    mocks.authenticateMemberRequest.mockResolvedValue({ user: {}, membership: {} });
    mocks.decodeStorageKey.mockReturnValue("branding/susan-drury-logo-320.webp");

    await request(createApp()).get("/api/member/media/encoded-key").expect(404);
    expect(mocks.fetchStoredObject).not.toHaveBeenCalled();
  });

  it("forwards byte ranges and streams Bunny response metadata and bytes", async () => {
    mocks.authenticateMemberRequest.mockResolvedValue({ user: {}, membership: {} });
    mocks.fetchStoredObject.mockResolvedValue(
      new Response(Uint8Array.from([10, 20, 30, 40]), {
        status: 206,
        headers: {
          "accept-ranges": "bytes",
          "content-length": "4",
          "content-range": "bytes 0-3/100",
          "content-type": "video/mp4",
          etag: '"qa-etag"',
        },
      })
    );

    const response = await request(createApp())
      .get("/api/member/media/encoded-key")
      .set("Range", "bytes=0-3")
      .expect(206);

    expect(mocks.fetchStoredObject).toHaveBeenCalledWith(
      "membership/video/lesson-intro.mp4",
      "bytes=0-3"
    );
    expect(response.headers["accept-ranges"]).toBe("bytes");
    expect(response.headers["content-range"]).toBe("bytes 0-3/100");
    expect(response.headers["content-type"]).toMatch(/^video\/mp4/);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(Buffer.from(response.body)).toEqual(Buffer.from([10, 20, 30, 40]));
  });
});

describe("public Bunny brand route", () => {
  it("rejects arbitrary Bunny object paths", async () => {
    await request(createBrandApp()).get("/api/public/brand/private-file.webp").expect(404);
    expect(mocks.fetchStoredObject).not.toHaveBeenCalled();
  });

  it("streams a whitelisted WebP from Bunny with public cache protections", async () => {
    const bytes = Uint8Array.from([82, 73, 70, 70]);
    mocks.fetchStoredObject.mockResolvedValue(
      new Response(bytes, {
        status: 200,
        headers: {
          "content-length": String(bytes.length),
          "content-type": "image/webp",
        },
      })
    );

    const response = await request(createBrandApp())
      .get("/api/public/brand/susan-drury-logo-96.webp")
      .expect(200);

    expect(mocks.fetchStoredObject).toHaveBeenCalledWith("branding/susan-drury-logo-96.webp");
    expect(response.headers["content-type"]).toMatch(/^image\/webp/);
    expect(response.headers["cache-control"]).toContain("public");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(Buffer.from(response.body)).toEqual(Buffer.from(bytes));
  });
});
