import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || (ctx.user.role !== "owner" && ctx.user.openId !== ENV.ownerOpenId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Existing admin-only call sites now mean project-owner only. This prevents a teacher
// or reviewer from changing staff access while preserving the established procedure name.
export const adminProcedure = ownerProcedure;

export const reviewerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !["owner", "admin", "teacher", "reviewer"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Төслийн үнэлгээний эрх шаардлагатай." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const teacherProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !["owner", "admin", "teacher"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Багшийн эрх шаардлагатай." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
