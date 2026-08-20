import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { learnerNotifications, notificationDeliveries, notificationPreferences, quizAttempts, users } from "../drizzle/schema";
import { lessonDetails } from "../shared/curriculum";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

describe("authenticated quiz attempt persistence", () => {
  it("stores, reads, and replaces a learner's quiz attempt through protected tRPC procedures", async () => {
    const db = await getDb();
    if (!db) return;

    const openId = `quiz-roundtrip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let userId: number | undefined;
    const questions = lessonDetails["py-if"]?.quiz;
    expect(questions).toHaveLength(2);

    try {
      await upsertUser({ openId, name: "Quiz Round Trip Learner", email: `${openId}@example.test`, loginMethod: "manus" });
      const learner = await getUserByOpenId(openId);
      userId = learner?.id;
      expect(userId).toBeTypeOf("number");
      if (!learner || !userId || !questions) return;

      const context = { user: learner, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;
      const caller = appRouter.createCaller(context);
      const correctAnswers = questions.map((question) => question.answer);

      const firstSubmission = await caller.quiz.submit({ courseId: "python", lessonId: "py-if", answers: correctAnswers });
      expect(firstSubmission).toMatchObject({ userId, courseId: "python", lessonId: "py-if", score: 100, totalQuestions: 2 });
      expect(firstSubmission.answersJson).toBe(JSON.stringify(correctAnswers));

      const savedAfterFirstSubmission = await caller.quiz.getAttempt({ lessonId: "py-if" });
      expect(savedAfterFirstSubmission).toMatchObject({ userId, score: 100, totalQuestions: 2, answersJson: JSON.stringify(correctAnswers) });

      const wrongAnswers = questions.map(() => 0);
      const secondSubmission = await caller.quiz.submit({ courseId: "python", lessonId: "py-if", answers: wrongAnswers });
      expect(secondSubmission).toMatchObject({ userId, score: 50, totalQuestions: 2, answersJson: JSON.stringify(wrongAnswers) });

      const savedAfterReplacement = await caller.quiz.getAttempt({ lessonId: "py-if" });
      expect(savedAfterReplacement).toMatchObject({ userId, score: 50, totalQuestions: 2, answersJson: JSON.stringify(wrongAnswers) });
      expect(await db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.lessonId, "py-if")))).toHaveLength(1);
    } finally {
      if (userId) {
        const notifications = await db.select({ id: learnerNotifications.id }).from(learnerNotifications).where(eq(learnerNotifications.userId, userId));
        for (const notification of notifications) await db.delete(notificationDeliveries).where(eq(notificationDeliveries.notificationId, notification.id));
        await db.delete(learnerNotifications).where(eq(learnerNotifications.userId, userId));
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
        await db.delete(quizAttempts).where(eq(quizAttempts.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
      }
      expect(await db.select().from(users).where(eq(users.openId, openId)).limit(1)).toHaveLength(0);
    }
  });
});
