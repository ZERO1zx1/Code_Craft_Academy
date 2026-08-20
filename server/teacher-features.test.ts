import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { auditLogs, learnerBadges, learnerNotifications, notificationDeliveries, notificationPreferences, onboardingProgress, projectAttachments, projectSubmissionVersions, projectSubmissions, pushSubscriptions, quizAttempts, rubricTemplates, staffInvitations, users } from "../drizzle/schema";
import { getDb, getUserByOpenId, saveProjectAttachment, upsertUser } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const anonymousContext = {
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

describe("teacher assessment and learner notification flows", () => {
  it("protects teacher monitoring and persists a rubric review with an opt-in learner notification", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const learnerOpenId = `assessment-learner-${suffix}`;
    const teacherOpenId = `assessment-teacher-${suffix}`;
    let learnerId: number | undefined;
    let teacherId: number | undefined;
    try {
      await expect(appRouter.createCaller(anonymousContext).teacher.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await upsertUser({ openId: learnerOpenId, name: "Assessment Learner", email: `${learnerOpenId}@example.test`, loginMethod: "manus" });
      await upsertUser({ openId: teacherOpenId, name: "Assessment Teacher", email: `${teacherOpenId}@example.test`, loginMethod: "manus" });
      const learner = await getUserByOpenId(learnerOpenId);
      const teacher = await getUserByOpenId(teacherOpenId);
      learnerId = learner?.id;
      teacherId = teacher?.id;
      expect(learnerId).toBeTypeOf("number");
      expect(teacherId).toBeTypeOf("number");
      if (!learner || !teacher || !learnerId || !teacherId) return;
      await db.update(users).set({ role: "admin" }).where(eq(users.id, teacherId));
      const admin = (await getUserByOpenId(teacherOpenId))!;
      const learnerCaller = appRouter.createCaller({ user: learner, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      const teacherCaller = appRouter.createCaller({ user: admin, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);

      await expect(learnerCaller.teacher.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
      const defaults = await learnerCaller.notifications.preferences();
      expect(defaults).toMatchObject({ lessonUpdatesEnabled: 1, quizResultsEnabled: 1, projectFeedbackEnabled: 1 });
      await expect(learnerCaller.projects.getMine({ courseId: "python" })).resolves.toBeNull();

      const submission = await learnerCaller.projects.submit({
        courseId: "python",
        projectLessonId: "py-project",
        repositoryUrl: "https://github.com/example/learning-tracker",
        liveUrl: "https://example.test/learning-tracker",
        summary: "Python command-line learning tracker that stores tasks, calculates progress, and reports clear input errors.",
      });
      expect(submission.status).toBe("submitted");
      const dashboard = await teacherCaller.teacher.dashboard();
      expect(dashboard.learners.some((row) => row.id === learnerId)).toBe(true);
      expect(dashboard.submissions.some(({ submission: row }) => row.id === submission.id)).toBe(true);

      const reviewed = await teacherCaller.teacher.reviewProject({
        submissionId: submission.id,
        status: "approved",
        functionalityScore: 38,
        codeQualityScore: 22,
        userExperienceScore: 17,
        completenessScore: 14,
        teacherFeedback: "Task flow ойлгомжтой ажиллаж байна. Дараагийн хувилбарт persistence layer-ээ тусад нь module болгоорой.",
      });
      expect(reviewed?.totalScore).toBe(91);
      expect(reviewed?.status).toBe("approved");
      const learnerSubmission = await learnerCaller.projects.getMine({ courseId: "python" });
      expect(learnerSubmission).toMatchObject({ totalScore: 91, status: "approved" });
      const notificationsAfterReview = await learnerCaller.notifications.list();
      expect(notificationsAfterReview.some((notification) => notification.type === "project" && notification.href === "/projects/python")).toBe(true);

      await learnerCaller.notifications.updatePreferences({ lessonUpdatesEnabled: true, quizResultsEnabled: true, projectFeedbackEnabled: false, emailEnabled: false, browserPushEnabled: false });
      await teacherCaller.teacher.reviewProject({
        submissionId: submission.id,
        status: "needs_revision",
        functionalityScore: 35,
        codeQualityScore: 20,
        userExperienceScore: 17,
        completenessScore: 13,
        teacherFeedback: "Accessibility болон input validation дээр дахин ажиллаад төслөө шинэчлэн илгээнэ үү.",
      });
      const notificationsAfterOptOut = await learnerCaller.notifications.list();
      expect(notificationsAfterOptOut).toHaveLength(notificationsAfterReview.length);
    } finally {
      if (learnerId) {
        const notifications = await db.select({ id: learnerNotifications.id }).from(learnerNotifications).where(eq(learnerNotifications.userId, learnerId));
        const submissions = await db.select({ id: projectSubmissions.id }).from(projectSubmissions).where(eq(projectSubmissions.userId, learnerId));
        for (const notification of notifications) await db.delete(notificationDeliveries).where(eq(notificationDeliveries.notificationId, notification.id));
        for (const submission of submissions) await db.delete(projectSubmissionVersions).where(eq(projectSubmissionVersions.submissionId, submission.id));
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, learnerId));
        await db.delete(learnerNotifications).where(eq(learnerNotifications.userId, learnerId));
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, learnerId));
        await db.delete(projectAttachments).where(eq(projectAttachments.userId, learnerId));
        await db.delete(projectSubmissions).where(eq(projectSubmissions.userId, learnerId));
        await db.delete(quizAttempts).where(eq(quizAttempts.userId, learnerId));
        await db.delete(users).where(eq(users.id, learnerId));
      }
      if (teacherId) await db.delete(users).where(eq(users.id, teacherId));
      expect(await db.select().from(users).where(and(eq(users.openId, learnerOpenId))).limit(1)).toHaveLength(0);
      expect(await db.select().from(users).where(and(eq(users.openId, teacherOpenId))).limit(1)).toHaveLength(0);
    }
  });

  it("allows owners to assign reviewer access while keeping lesson publishing teacher-only and persists a browser push subscription", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminOpenId = `role-admin-${suffix}`;
    const learnerOpenId = `role-learner-${suffix}`;
    let adminId: number | undefined;
    let learnerId: number | undefined;
    try {
      await upsertUser({ openId: adminOpenId, name: "Role Admin", email: `${adminOpenId}@example.test`, loginMethod: "manus" });
      await upsertUser({ openId: learnerOpenId, name: "Role Learner", email: `${learnerOpenId}@example.test`, loginMethod: "manus" });
      const adminRow = await getUserByOpenId(adminOpenId);
      const learnerRow = await getUserByOpenId(learnerOpenId);
      adminId = adminRow?.id;
      learnerId = learnerRow?.id;
      if (!adminRow || !learnerRow || !adminId || !learnerId) return;
      await db.update(users).set({ role: "owner" }).where(eq(users.id, adminId));
      const admin = (await getUserByOpenId(adminOpenId))!;
      const adminCaller = appRouter.createCaller({ user: admin, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);

      const directory = await adminCaller.teacher.roleDirectory();
      expect(directory.some((member) => member.id === learnerId && member.role === "user")).toBe(true);
      const updated = await adminCaller.teacher.setRole({ userId: learnerId, role: "reviewer" });
      expect(updated?.role).toBe("reviewer");

      const reviewer = (await getUserByOpenId(learnerOpenId))!;
      const reviewerCaller = appRouter.createCaller({ user: reviewer, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      await expect(reviewerCaller.teacher.dashboard()).resolves.toMatchObject({ summary: expect.any(Object) });
      await expect(reviewerCaller.teacher.publishLesson({ courseId: "python", title: "Шинэ lesson", content: "Reviewer энэ update-ийг нийтлэх эрхгүй." })).rejects.toMatchObject({ code: "FORBIDDEN" });

      const subscription = await reviewerCaller.notifications.savePushSubscription({ endpoint: `https://push.example.test/${suffix}`, p256dh: "a".repeat(32), auth: "b".repeat(16) });
      expect(subscription).toMatchObject({ userId: learnerId, endpoint: `https://push.example.test/${suffix}` });
      expect(await reviewerCaller.notifications.pushSubscription()).toMatchObject({ userId: learnerId });
      await reviewerCaller.notifications.clearPushSubscription();
      expect(await reviewerCaller.notifications.pushSubscription()).toBeUndefined();
    } finally {
      if (learnerId) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, learnerId));
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, learnerId));
        await db.delete(users).where(eq(users.id, learnerId));
      }
      if (adminId) {
        await db.delete(auditLogs).where(eq(auditLogs.actorId, adminId));
        await db.delete(users).where(eq(users.id, adminId));
      }
    }
  });

  it("uses the active teacher rubric for versioned multi-file learner submissions and exposes delivery analytics only to staff", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ownerOpenId = `rubric-owner-${suffix}`;
    const teacherOpenId = `rubric-teacher-${suffix}`;
    const learnerOpenId = `rubric-learner-${suffix}`;
    let ownerId: number | undefined;
    let teacherId: number | undefined;
    let learnerId: number | undefined;
    try {
      await upsertUser({ openId: ownerOpenId, name: "Rubric Owner", email: `${ownerOpenId}@example.test`, loginMethod: "manus" });
      await upsertUser({ openId: teacherOpenId, name: "Report Teacher", email: `${teacherOpenId}@example.test`, loginMethod: "manus" });
      await upsertUser({ openId: learnerOpenId, name: "Version Learner", email: `${learnerOpenId}@example.test`, loginMethod: "manus" });
      const ownerRow = await getUserByOpenId(ownerOpenId);
      const teacherRow = await getUserByOpenId(teacherOpenId);
      const learnerRow = await getUserByOpenId(learnerOpenId);
      ownerId = ownerRow?.id;
      teacherId = teacherRow?.id;
      learnerId = learnerRow?.id;
      if (!ownerRow || !teacherRow || !learnerRow || !ownerId || !teacherId || !learnerId) return;
      await db.update(users).set({ role: "owner" }).where(eq(users.id, ownerId));
      await db.update(users).set({ role: "teacher" }).where(eq(users.id, teacherId));
      const owner = (await getUserByOpenId(ownerOpenId))!;
      const teacher = (await getUserByOpenId(teacherOpenId))!;
      const learner = (await getUserByOpenId(learnerOpenId))!;
      const ownerCaller = appRouter.createCaller({ user: owner, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      const teacherCaller = appRouter.createCaller({ user: teacher, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      const learnerCaller = appRouter.createCaller({ user: learner, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      await expect(learnerCaller.notifications.deliveryAnalytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
      const rubric = await ownerCaller.teacher.createRubric({ courseId: "python", name: "Python capstone rubric", description: "Бодит төсөлд ашиглах 100 онооны шалгуур.", makeActive: true, criteria: [{ id: "working", label: "Ажиллагаа", maxPoints: 40 }, { id: "quality", label: "Кодын чанар", maxPoints: 30 }, { id: "ux", label: "UX", maxPoints: 20 }, { id: "complete", label: "Гүйцэтгэл", maxPoints: 10 }] });
      expect(rubric?.isActive).toBe(1);
      await saveProjectAttachment({ userId: learnerId, courseId: "python", projectLessonId: "py-project", fileName: "README.md", storageKey: `tests/${suffix}/README.md`, url: "https://example.test/README.md", mimeType: "text/markdown", sizeBytes: 12, previewKind: "text" });
      await saveProjectAttachment({ userId: learnerId, courseId: "python", projectLessonId: "py-project", fileName: "app.py", storageKey: `tests/${suffix}/v1/app.py`, url: "https://example.test/v1/app.py", mimeType: "text/x-python", sizeBytes: 34, previewKind: "text" });
      const first = await learnerCaller.projects.submit({ courseId: "python", projectLessonId: "py-project", repositoryUrl: "https://github.com/example/v1", liveUrl: "", summary: "First practical Python project version with a reliable command-line workflow and clear documentation for reviewers." });
      await saveProjectAttachment({ userId: learnerId, courseId: "python", projectLessonId: "py-project", fileName: "app.py", storageKey: `tests/${suffix}/v2/app.py`, url: "https://example.test/v2/app.py", mimeType: "text/x-python", sizeBytes: 34, previewKind: "text" });
      const second = await learnerCaller.projects.submit({ courseId: "python", projectLessonId: "py-project", repositoryUrl: "https://github.com/example/v2", liveUrl: "", summary: "Second practical Python project version with improved validation, clearer output, and an accessible review-ready interface." });
      expect(second.id).toBe(first.id);
      const history = await learnerCaller.projects.history({ courseId: "python" });
      expect(history.versions).toHaveLength(2);
      expect(history.versions[0]).toMatchObject({ versionNumber: 2 });
      expect(history.versions.flatMap((version) => version.attachments).map((attachment) => attachment.fileName)).toEqual(expect.arrayContaining(["README.md", "app.py"]));
      const diff = await learnerCaller.projects.compareVersions({ courseId: "python", fromVersion: 1, toVersion: 2 });
      expect(diff).toMatchObject({ from: { versionNumber: 1, repositoryUrl: "https://github.com/example/v1" }, to: { versionNumber: 2, repositoryUrl: "https://github.com/example/v2" }, fields: { repositoryUrlChanged: true }, attachments: { added: expect.arrayContaining([expect.objectContaining({ fileName: "app.py" })]), removed: expect.arrayContaining([expect.objectContaining({ fileName: "app.py" })]), modified: [expect.objectContaining({ before: expect.objectContaining({ fileName: "app.py", sizeBytes: 34 }), after: expect.objectContaining({ fileName: "app.py", sizeBytes: 34 }) })] } });
      expect(diff.fields.summary.added.length + diff.fields.summary.removed.length).toBeGreaterThan(0);
      expect(diff.attachments.added[0]).not.toHaveProperty("content");
      expect(diff.attachments.modified[0].after).not.toHaveProperty("storageKey");

      await expect(learnerCaller.teacher.gradeReport()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(teacherCaller.teacher.gradeReport()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ submissionId: second.id, courseId: "python", learnerEmail: `${learnerOpenId}@example.test` })]));
      await expect(ownerCaller.teacher.gradeReport()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ submissionId: second.id })]));

      await expect(learnerCaller.teacher.exportRubrics({ courseId: "python" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      const exported = await ownerCaller.teacher.exportRubrics({ courseId: "python" });
      expect(exported).toMatchObject({ format: "codecraft-rubric/v1", templates: expect.arrayContaining([expect.objectContaining({ name: "Python capstone rubric", courseId: "python" })]) });
      const transfer = { format: "codecraft-rubric/v1" as const, templates: [{ courseId: "css" as const, name: "CSS imported rubric", description: "Импортын contract шалгах 100 онооны rubric.", makeActive: false, criteria: [{ id: "layout", label: "Layout", maxPoints: 50 }, { id: "quality", label: "Quality", maxPoints: 50 }] }] };
      await expect(learnerCaller.teacher.importRubrics(transfer)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(ownerCaller.teacher.importRubrics(transfer)).resolves.toMatchObject({ imported: 1, templates: [expect.objectContaining({ courseId: "css", name: "CSS imported rubric" })] });
      expect((await ownerCaller.notifications.deliveryAnalytics()).total).toBeGreaterThanOrEqual(0);
    } finally {
      if (learnerId) {
        const submissions = await db.select({ id: projectSubmissions.id }).from(projectSubmissions).where(eq(projectSubmissions.userId, learnerId));
        for (const submission of submissions) await db.delete(projectSubmissionVersions).where(eq(projectSubmissionVersions.submissionId, submission.id));
        await db.delete(projectAttachments).where(eq(projectAttachments.userId, learnerId));
        await db.delete(projectSubmissions).where(eq(projectSubmissions.userId, learnerId));
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, learnerId));
        await db.delete(users).where(eq(users.id, learnerId));
      }
      if (ownerId) {
        await db.delete(rubricTemplates).where(eq(rubricTemplates.createdBy, ownerId));
        await db.delete(auditLogs).where(eq(auditLogs.actorId, ownerId));
        await db.delete(users).where(eq(users.id, ownerId));
      }
      if (teacherId) await db.delete(users).where(eq(users.id, teacherId));
    }
  });

  it("persists a learner-selected display name while keeping the OAuth identity unchanged", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const openId = `display-name-${suffix}`;
    let userId: number | undefined;
    try {
      await upsertUser({ openId, name: "OAuth Identity", email: `${openId}@example.test`, loginMethod: "manus" });
      const user = await getUserByOpenId(openId);
      userId = user?.id;
      if (!user || !userId) return;
      const caller = appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      await expect(appRouter.createCaller(anonymousContext).profile.updateDisplayName({ displayName: "Тэмүүлэн" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(caller.profile.updateDisplayName({ displayName: "Т" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      const updated = await caller.profile.updateDisplayName({ displayName: "  Тэмүүлэн  " });
      expect(updated).toMatchObject({ id: userId, name: "OAuth Identity", displayName: "Тэмүүлэн" });
      expect(await caller.profile.public({ userId })).toMatchObject({ name: "OAuth Identity", displayName: "Тэмүүлэн" });
    } finally {
      if (userId) await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("records safe owner activity, supports one-time staff invitations, and persists role-aware onboarding idempotently", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ownerOpenId = `workflow-owner-${suffix}`;
    const inviteeOpenId = `workflow-invitee-${suffix}`;
    let ownerId: number | undefined;
    let inviteeId: number | undefined;
    try {
      await upsertUser({ openId: ownerOpenId, name: "Workflow Owner", email: `${ownerOpenId}@example.test`, loginMethod: "manus" });
      await upsertUser({ openId: inviteeOpenId, name: "Workflow Invitee", email: `${inviteeOpenId}@example.test`, loginMethod: "manus" });
      const ownerRow = await getUserByOpenId(ownerOpenId);
      const inviteeRow = await getUserByOpenId(inviteeOpenId);
      ownerId = ownerRow?.id;
      inviteeId = inviteeRow?.id;
      if (!ownerRow || !inviteeRow || !ownerId || !inviteeId) return;
      await db.update(users).set({ role: "owner" }).where(eq(users.id, ownerId));
      const owner = (await getUserByOpenId(ownerOpenId))!;
      const invitee = (await getUserByOpenId(inviteeOpenId))!;
      const ownerCaller = appRouter.createCaller({ user: owner, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      const inviteeCaller = appRouter.createCaller({ user: invitee, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);

      await expect(appRouter.createCaller(anonymousContext).owner.auditLog()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(inviteeCaller.owner.invitations.create({ email: `${inviteeOpenId}@example.test`, role: "teacher" })).rejects.toMatchObject({ code: "FORBIDDEN" });

      const created = await ownerCaller.owner.invitations.create({ email: ` ${inviteeOpenId.toUpperCase()}@EXAMPLE.TEST `, role: "reviewer" });
      expect(created.token).toHaveLength(40);
      expect(created.invitation).toMatchObject({ email: `${inviteeOpenId}@example.test`, role: "reviewer", status: "pending" });
      const stored = (await db.select().from(staffInvitations).where(eq(staffInvitations.id, created.invitation.id)).limit(1))[0];
      expect(stored?.tokenHash).not.toBe(created.token);
      const visibleInvitations = await ownerCaller.owner.invitations.list();
      expect(visibleInvitations.find((item) => item.id === created.invitation.id)).not.toHaveProperty("tokenHash");
      await expect(ownerCaller.owner.invitations.create({ email: `${inviteeOpenId}@example.test`, role: "reviewer" })).rejects.toThrow("хүлээгдэж буй урилга");

      const firstCompletion = await inviteeCaller.onboarding.complete({ taskId: "profile-finish" });
      const duplicateCompletion = await inviteeCaller.onboarding.complete({ taskId: "profile-finish" });
      expect(firstCompletion).toMatchObject({ changed: true, completedTaskIds: ["profile-finish"] });
      expect(duplicateCompletion).toMatchObject({ changed: false, completedTaskIds: ["profile-finish"] });
      await expect(inviteeCaller.onboarding.complete({ taskId: "owner-audit" })).rejects.toThrow("эрхэд хамаарах");
      expect(await inviteeCaller.onboarding.progress()).toMatchObject({ completedTaskIds: ["profile-finish"] });

      const accepted = await inviteeCaller.owner.invitations.accept({ token: created.token });
      expect(accepted).toEqual({ role: "reviewer" });
      expect((await getUserByOpenId(inviteeOpenId))?.role).toBe("reviewer");
      await expect(inviteeCaller.owner.invitations.accept({ token: created.token })).rejects.toThrow("хүчингүй");

      const reviewer = (await getUserByOpenId(inviteeOpenId))!;
      const reviewerCaller = appRouter.createCaller({ user: reviewer, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext);
      await reviewerCaller.onboarding.complete({ taskId: "reviewer-dashboard" });
      await reviewerCaller.onboarding.complete({ taskId: "reviewer-review" });
      const finishedOnboarding = await reviewerCaller.onboarding.complete({ taskId: "notification-inbox" });
      expect(finishedOnboarding.newlyAwardedSlugs).toContain("onboarding-complete");
      const profileAfterOnboarding = await reviewerCaller.profile.public({ userId: inviteeId });
      expect(profileAfterOnboarding.badges.map((item) => item.badge.slug)).toContain("onboarding-complete");

      const expired = await ownerCaller.owner.invitations.create({ email: `${inviteeOpenId}@example.test`, role: "teacher" });
      await db.update(staffInvitations).set({ expiresAt: new Date(Date.now() - 1_000) }).where(eq(staffInvitations.id, expired.invitation.id));
      await expect(inviteeCaller.owner.invitations.accept({ token: expired.token })).rejects.toThrow("хугацаа дууссан");
      expect((await db.select({ status: staffInvitations.status }).from(staffInvitations).where(eq(staffInvitations.id, expired.invitation.id)).limit(1))[0]).toMatchObject({ status: "expired" });

      const revoked = await ownerCaller.owner.invitations.create({ email: `revoke-${suffix}@example.test`, role: "teacher" });
      await expect(ownerCaller.owner.invitations.revoke({ id: revoked.invitation.id })).resolves.toEqual({ success: true });
      const audit = await ownerCaller.owner.auditLog({ limit: 20, offset: 0 });
      expect(audit.items.map((item) => item.action)).toEqual(expect.arrayContaining(["invitation_created", "invitation_accepted", "invitation_revoked", "invitation_email_skipped", "onboarding_completed"]));
      expect(audit.items.find((item) => item.action === "invitation_created")?.metadataJson).not.toContain(created.token);
      const filteredAudit = await ownerCaller.owner.auditLog({ limit: 20, offset: 0, action: "invitation_email_skipped" });
      expect(filteredAudit.items.length).toBeGreaterThan(0);
      expect(filteredAudit.items.every((item) => item.action === "invitation_email_skipped")).toBe(true);
    } finally {
      if (ownerId || inviteeId) {
        const ids = [ownerId, inviteeId].filter((id): id is number => typeof id === "number");
        if (ids.length) {
          const invitations = await db.select({ id: staffInvitations.id }).from(staffInvitations).where(eq(staffInvitations.invitedBy, ownerId ?? -1));
          for (const invitation of invitations) await db.delete(staffInvitations).where(eq(staffInvitations.id, invitation.id));
          await db.delete(auditLogs).where(eq(auditLogs.actorId, inviteeId ?? -1));
          await db.delete(auditLogs).where(eq(auditLogs.actorId, ownerId ?? -1));
          await db.delete(onboardingProgress).where(eq(onboardingProgress.userId, inviteeId ?? -1));
          await db.delete(learnerBadges).where(eq(learnerBadges.userId, inviteeId ?? -1));
          if (inviteeId) await db.delete(users).where(eq(users.id, inviteeId));
          if (ownerId) await db.delete(users).where(eq(users.id, ownerId));
        }
      }
    }
  }, 10_000);
});
