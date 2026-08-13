import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { memberRouter } from "./routers/member";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  member: memberRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
