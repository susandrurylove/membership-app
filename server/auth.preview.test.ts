import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function signedOutContext(): TrpcContext {
  return {
    user: null,
    membership: null,
    sessionTokenHash: null,
    authMethod: null,
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("development preview sign-in", () => {
  it("is forbidden outside the development runtime", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const caller = appRouter.createCaller(signedOutContext());
      await expect(caller.auth.previewSignIn()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Preview sign-in is disabled.",
      });
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
