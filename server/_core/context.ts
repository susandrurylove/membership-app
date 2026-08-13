import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Membership, User } from "../../drizzle/schema";
import { authenticateMemberRequest } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  membership: Membership | null;
  sessionTokenHash: string | null;
  authMethod: "member" | null;
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

  return {
    req: opts.req,
    res: opts.res,
    user,
    membership,
    sessionTokenHash,
    authMethod,
  };
}
