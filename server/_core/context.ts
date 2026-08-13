import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Membership, User } from "../../drizzle/schema";
import { authenticateMemberRequest } from "../auth";
import { getMembershipByUserId } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  membership: Membership | null;
  sessionTokenHash: string | null;
  authMethod: "member" | "manus" | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let membership: Membership | null = null;
  let sessionTokenHash: string | null = null;
  let authMethod: TrpcContext["authMethod"] = null;

  try {
    const memberAuth = await authenticateMemberRequest(opts.req);
    if (memberAuth) {
      user = memberAuth.user;
      membership = memberAuth.membership;
      sessionTokenHash = memberAuth.sessionTokenHash;
      authMethod = "member";
    }
  } catch {
    user = null;
  }

  if (!user && process.env.OAUTH_SERVER_URL && process.env.VITE_APP_ID) {
    try {
      user = await sdk.authenticateRequest(opts.req);
      if (user) {
        membership = (await getMembershipByUserId(user.id)) ?? null;
        authMethod = "manus";
      }
    } catch {
      user = null;
      membership = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    membership,
    sessionTokenHash,
    authMethod,
  };
}

