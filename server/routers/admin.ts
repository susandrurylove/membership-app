import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  createInvitedMember,
  getAdminCourseStructure,
  getAdminOverview,
  listAdminCategories,
  listAdminCourses,
  listAdminMedia,
  listAdminMembers,
  listAdminTeachings,
  refreshMemberInvitation,
  saveCategory,
  saveCourse,
  saveCourseLesson,
  saveCourseSection,
  saveTeaching,
  updateMemberAccess,
} from "../adminData";

const publicationStatus = z.enum(["draft", "published", "archived"]);
const contentType = z.enum(["video", "audio", "image", "text", "mixed"]);
const membershipTier = z.enum(["silver", "gold", "platinum", "custom"]);
const membershipStatus = z.enum(["pending", "active", "paused", "cancelled", "expired"]);

export const adminRouter = router({
  overview: adminProcedure.query(() => getAdminOverview()),

  members: router({
    list: adminProcedure
      .input(z.object({ search: z.string().max(160).optional() }).optional())
      .query(({ input }) => listAdminMembers(input?.search)),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(200),
          email: z.string().trim().email().max(320),
          tier: membershipTier,
          membershipStatus: z.enum(["pending", "active"]),
          endsAt: z.date().nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await createInvitedMember({ actorUserId: ctx.user.id, ...input });
        } catch (error) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error instanceof Error ? error.message : "The member could not be created.",
          });
        }
      }),
    updateAccess: adminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          accountStatus: z.enum(["invited", "active", "suspended"]),
          tier: membershipTier,
          membershipStatus,
          endsAt: z.date().nullable().optional(),
          internalNotes: z.string().max(4000).nullable().optional(),
        })
      )
      .mutation(({ input, ctx }) => updateMemberAccess({ actorUserId: ctx.user.id, ...input })),
    refreshInvitation: adminProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const invitation = await refreshMemberInvitation(ctx.user.id, input.userId);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
        return invitation;
      }),
  }),

  categories: router({
    list: adminProcedure.query(() => listAdminCategories()),
    save: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          name: z.string().trim().min(1).max(160),
          description: z.string().max(2000).nullable().optional(),
          sortOrder: z.number().int().min(0).max(10000).default(0),
        })
      )
      .mutation(({ input, ctx }) => saveCategory({ actorUserId: ctx.user.id, ...input })),
  }),

  media: router({
    list: adminProcedure.query(() => listAdminMedia()),
  }),

  teachings: router({
    list: adminProcedure.query(() => listAdminTeachings()),
    save: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          title: z.string().trim().min(1).max(240),
          summary: z.string().max(4000).nullable().optional(),
          body: z.string().max(100000).nullable().optional(),
          contentType,
          status: publicationStatus,
          featured: z.boolean().default(false),
          sortOrder: z.number().int().min(0).max(10000).default(0),
          mediaAssetId: z.number().int().positive().nullable().optional(),
        })
      )
      .mutation(({ input, ctx }) => saveTeaching({ actorUserId: ctx.user.id, ...input })),
  }),

  courses: router({
    list: adminProcedure.query(() => listAdminCourses()),
    detail: adminProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const course = await getAdminCourseStructure(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        return course;
      }),
    save: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          title: z.string().trim().min(1).max(240),
          summary: z.string().max(4000).nullable().optional(),
          description: z.string().max(100000).nullable().optional(),
          status: publicationStatus,
          estimatedMinutes: z.number().int().min(1).max(100000).nullable().optional(),
          sortOrder: z.number().int().min(0).max(10000).default(0),
          coverAssetId: z.number().int().positive().nullable().optional(),
        })
      )
      .mutation(({ input, ctx }) => saveCourse({ actorUserId: ctx.user.id, ...input })),
    saveSection: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          courseId: z.number().int().positive(),
          title: z.string().trim().min(1).max(240),
          description: z.string().max(4000).nullable().optional(),
          sortOrder: z.number().int().min(0).max(10000).default(0),
        })
      )
      .mutation(({ input, ctx }) => saveCourseSection({ actorUserId: ctx.user.id, ...input })),
    saveLesson: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          courseId: z.number().int().positive(),
          sectionId: z.number().int().positive().nullable().optional(),
          title: z.string().trim().min(1).max(240),
          summary: z.string().max(4000).nullable().optional(),
          body: z.string().max(100000).nullable().optional(),
          contentType,
          mediaAssetId: z.number().int().positive().nullable().optional(),
          status: publicationStatus,
          estimatedMinutes: z.number().int().min(1).max(100000).nullable().optional(),
          sortOrder: z.number().int().min(0).max(10000).default(0),
        })
      )
      .mutation(({ input, ctx }) => saveCourseLesson({ actorUserId: ctx.user.id, ...input })),
  }),
});

