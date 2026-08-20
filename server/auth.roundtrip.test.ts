import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { badgeDefinitions, certificates, courseProgress, learnerBadges, users } from "../drizzle/schema";
import { getDb, getPublicProfile, getUserByOpenId, upsertCourseProgress, upsertUser } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// This test intentionally uses the configured project database. It creates one
// uniquely identified learner and removes every row it created in a finally block.
describe("authenticated learner database round trip", () => {
  it("persists OAuth identity, progress, awarded badge, and public profile data", async () => {
    const db = await getDb();
    if (!db) return;
    const openId = `roundtrip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let userId: number | undefined;
    try {
      await upsertUser({ openId, name: "Round Trip Learner", email: `${openId}@example.test`, loginMethod: "manus" });
      const persisted = await getUserByOpenId(openId);
      expect(persisted?.name).toBe("Round Trip Learner");
      userId = persisted?.id;
      expect(userId).toBeTypeOf("number");
      if (!userId) return;

      await upsertCourseProgress({ userId, courseId: "python", progressPercent: 10 });
      const ctx = { user: persisted!, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;
      const caller = appRouter.createCaller(ctx);
      await caller.progress.update({ courseId: "python", progressPercent: 25 });
      const protectedProgress = await caller.progress.list();
      expect(protectedProgress.find((row) => row.courseId === "python")?.progressPercent).toBe(25);
      const publicFromRouter = await appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }).profile.public({ userId });
      expect(publicFromRouter?.progress.find((row) => row.courseId === "python")?.progressPercent).toBe(25);
      const profile = await getPublicProfile(userId);
      expect(profile?.progress.find((row) => row.courseId === "python")?.progressPercent).toBe(25);
      expect(profile?.badges.some(({ badge }) => badge.slug === "first-progress")).toBe(true);
      await upsertCourseProgress({ userId, courseId: "python", progressPercent: 90 });
      await upsertCourseProgress({ userId, courseId: "html", progressPercent: 90 });
      await upsertCourseProgress({ userId, courseId: "css", progressPercent: 90 });
      await upsertCourseProgress({ userId, courseId: "javascript", progressPercent: 90 });
      const completed = await getPublicProfile(userId);
      expect(completed?.certificate?.certificateType).toBe("web-foundations");
      expect(completed?.certificate?.verificationCode).toMatch(/^CC-/);
      expect(completed?.badges.filter(({ badge }) => badge.slug === "python-explorer")).toHaveLength(1);
    } finally {
      if (userId) {
        await db.delete(certificates).where(eq(certificates.userId, userId));
        await db.delete(learnerBadges).where(eq(learnerBadges.userId, userId));
        await db.delete(courseProgress).where(eq(courseProgress.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
      }
      // Keep the assertion explicit so the test proves cleanup targeted only its own row.
      expect(await db.select().from(users).where(and(eq(users.openId, openId))).limit(1)).toHaveLength(0);
    }
  }, 10_000);
});
