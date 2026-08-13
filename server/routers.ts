import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { memberRouter } from "./routers/member";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  auth: authRouter,
  member: memberRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
