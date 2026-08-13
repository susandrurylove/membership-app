import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  authenticateEmailAndPassword,
  hashPassword,
  issueMemberSession,
  MEMBER_SESSION_COOKIE,
  memberCookieOptions,
  revokeCurrentMemberSession,
  sha256,
  toViewer,
} from "../auth";
import {
  acceptInvitationByTokenHash,
  getInvitationByTokenHash,
  getMembershipByUserId,
  getUserByOpenId,
  upsertUser,
} from "../db";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return toViewer(ctx.user, ctx.membership);
  }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(12).max(200),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await authenticateEmailAndPassword(input.email, input.password);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The email or password was not recognized.",
        });
      }

      const session = await issueMemberSession(user, ctx.req);
      ctx.res.cookie(MEMBER_SESSION_COOKIE, session.token, memberCookieOptions(ctx.req));
      const membership = (await getMembershipByUserId(user.id)) ?? null;
      return toViewer(user, membership);
    }),

  previewSignIn: publicProcedure.mutation(async ({ ctx }) => {
    if (process.env.NODE_ENV !== "development") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Preview sign-in is disabled." });
    }

    const previewOpenId = "development-preview-admin";
    await upsertUser({
      openId: previewOpenId,
      name: "Portal Administrator",
      loginMethod: "development-preview",
      role: "admin",
      accountStatus: "active",
      lastSignedIn: new Date(),
    });
    const user = await getUserByOpenId(previewOpenId);
    if (!user) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Preview account could not be prepared." });
    }

    const session = await issueMemberSession(user, ctx.req);
    ctx.res.cookie(MEMBER_SESSION_COOKIE, session.token, memberCookieOptions(ctx.req));
    const membership = (await getMembershipByUserId(user.id)) ?? null;
    return toViewer(user, membership);
  }),

  invitation: publicProcedure
    .input(z.object({ token: z.string().min(32).max(256) }))
    .query(async ({ input }) => {
      const invitation = await getInvitationByTokenHash(sha256(input.token));
      if (!invitation) return { valid: false as const };
      return {
        valid: true as const,
        name: invitation.user.name,
        email: invitation.user.email,
        expiresAt: invitation.invitation.expiresAt,
      };
    }),

  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(32).max(256),
        password: z
          .string()
          .min(12)
          .max(200)
          .regex(/[a-z]/, "Include a lowercase letter")
          .regex(/[A-Z]/, "Include an uppercase letter")
          .regex(/[0-9]/, "Include a number"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const passwordHash = await hashPassword(input.password);
      const result = await acceptInvitationByTokenHash(sha256(input.token), passwordHash);
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation is invalid or has expired.",
        });
      }

      const session = await issueMemberSession(result.user, ctx.req);
      ctx.res.cookie(MEMBER_SESSION_COOKIE, session.token, memberCookieOptions(ctx.req));
      return toViewer(result.user, result.membership);
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await revokeCurrentMemberSession(ctx.req);
    const { maxAge: _memberMaxAge, ...memberClearOptions } = memberCookieOptions(ctx.req);
    ctx.res.clearCookie(MEMBER_SESSION_COOKIE, memberClearOptions);
    return { success: true } as const;
  }),
});
