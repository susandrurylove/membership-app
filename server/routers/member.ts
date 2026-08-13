import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { appKeys, createSsoLaunch, listIntegrationStatus } from "../sso";
import {
  getMemberDashboard,
  getProtectedMediaUrl,
  getPublishedCourse,
  getPublishedTeaching,
  listPublishedCourses,
  listPublishedTeachings,
  listTeachingCategories,
  updateLessonProgress,
} from "../memberData";
import {
  getDevelopmentCourseFixture,
  getDevelopmentMediaFixture,
  getDevelopmentTeachingFixture,
  isDevelopmentQaRequest,
  QA_COURSE_SLUG,
  QA_TEACHING_SLUG,
} from "../qaFixtures";

const slugSchema = z.string().min(1).max(260).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const memberRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => getMemberDashboard(ctx.user.id)),

  teachings: router({
    categories: protectedProcedure.query(() => listTeachingCategories()),
    list: protectedProcedure
      .input(z.object({ category: slugSchema.optional() }).optional())
      .query(({ input }) => listPublishedTeachings(input?.category)),
    bySlug: protectedProcedure
      .input(z.object({ slug: slugSchema }))
      .query(async ({ input, ctx }) => {
        if (isDevelopmentQaRequest() && input.slug === QA_TEACHING_SLUG) {
          return getDevelopmentTeachingFixture();
        }
        const item = await getPublishedTeaching(ctx.user.id, input.slug);
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Teaching not found" });
        return item;
      }),
  }),

  courses: router({
    list: protectedProcedure.query(({ ctx }) => listPublishedCourses(ctx.user.id)),
    bySlug: protectedProcedure
      .input(z.object({ slug: slugSchema }))
      .query(async ({ input, ctx }) => {
        if (isDevelopmentQaRequest() && input.slug === QA_COURSE_SLUG) {
          return getDevelopmentCourseFixture();
        }
        const course = await getPublishedCourse(ctx.user.id, input.slug);
        if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        return course;
      }),
    updateProgress: protectedProcedure
      .input(
        z.object({
          lessonId: z.number().int().positive(),
          percentComplete: z.number().int().min(0).max(100),
          lastPositionSeconds: z.number().int().min(0).max(86_400).default(0),
          completed: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await updateLessonProgress({ userId: ctx.user.id, ...input });
        if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
        return course;
      }),
  }),

  media: router({
    url: protectedProcedure
      .input(z.object({ mediaId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const developmentMedia = getDevelopmentMediaFixture(input.mediaId);
        if (developmentMedia) return developmentMedia;
        const media = await getProtectedMediaUrl(input.mediaId);
        if (!media) throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
        return media;
      }),
  }),

  apps: router({
    list: protectedProcedure.query(() => listIntegrationStatus()),
    launch: protectedProcedure
      .input(z.object({ appKey: z.enum(appKeys) }))
      .mutation(async ({ input, ctx }) => {
        const launch = await createSsoLaunch(ctx.user.id, input.appKey);
        if (!launch) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This app connection is not configured yet.",
          });
        }
        return launch;
      }),
  }),
});
