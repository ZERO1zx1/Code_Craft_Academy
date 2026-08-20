import { and, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditLogs, InsertUser, onboardingProgress, staffInvitations, users, courseProgress, badgeDefinitions, learnerBadges, certificates, quizAttempts, projectSubmissions, projectAttachments, projectSubmissionVersions, rubricTemplates, notificationPreferences, learnerNotifications, notificationDeliveries, pushSubscriptions, type InsertCourseProgress } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { deliverLearnerNotification } from "./notificationDelivery";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'owner';
      updateSet.role = 'owner';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserDisplayName(input: { userId: number; displayName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const displayName = input.displayName.trim();
  await db.update(users).set({ displayName }).where(eq(users.id, input.userId));
  const result = await db.select({ id: users.id, name: users.name, displayName: users.displayName, role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
  return result[0];
}

export async function getCourseProgressForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courseProgress).where(eq(courseProgress.userId, userId));
}

const BADGE_CATALOG = [
  { slug: "first-progress", title: "First progress", description: "Эхний сургалтын ахицаа хадгалсан.", criteriaType: "any_progress", criteriaValue: 1 },
  { slug: "python-explorer", title: "Python explorer", description: "Python курсыг 60%-иас дээш судалсан.", criteriaType: "course_progress", criteriaValue: 60 },
  { slug: "web-builder", title: "Web builder", description: "HTML болон CSS курсуудыг 60%-иас дээш судалсан.", criteriaType: "web_foundations", criteriaValue: 60 },
  { slug: "project-finisher", title: "Project finisher", description: "CSS болон JavaScript курсуудыг 60%-иас дээш судалсан.", criteriaType: "web_projects", criteriaValue: 60 },
  { slug: "onboarding-complete", title: "Системтэй танилцсан", description: "Өөрийн дүрд тохирсон системтэй танилцах бүх алхмыг амжилттай дуусгасан.", criteriaType: "onboarding_complete", criteriaValue: 100 },
] as const;

const ONBOARDING_BADGE_TASKS_BY_ROLE: Record<string, readonly string[]> = {
  user: ["profile-finish", "first-lesson", "editor-open"],
  reviewer: ["reviewer-dashboard", "reviewer-review", "notification-inbox"],
  teacher: ["teacher-dashboard", "teacher-rubric", "teacher-publish"],
  admin: ["owner-operations", "owner-invitations", "owner-audit"],
  owner: ["owner-operations", "owner-invitations", "owner-audit"],
};

async function ensureBadgeCatalog(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  for (const badge of BADGE_CATALOG) {
    await db.insert(badgeDefinitions).values(badge).onDuplicateKeyUpdate({ set: { title: badge.title, description: badge.description, criteriaType: badge.criteriaType, criteriaValue: badge.criteriaValue } });
  }
  return db.select().from(badgeDefinitions);
}

export async function evaluateAndAwardAchievements(userId: number, options: { includeOnboarding?: boolean } = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const progressRows = await getCourseProgressForUser(userId);
  const progress = Object.fromEntries(progressRows.map((row) => [row.courseId, row.progressPercent]));
  const catalog = await ensureBadgeCatalog(db);
  const eligible = new Set<string>();
  if (Object.values(progress).some((value) => value >= 1)) eligible.add("first-progress");
  if ((progress.python ?? 0) >= 60) eligible.add("python-explorer");
  if ((progress.html ?? 0) >= 60 && (progress.css ?? 0) >= 60) eligible.add("web-builder");
  if ((progress.css ?? 0) >= 60 && (progress.javascript ?? 0) >= 60) eligible.add("project-finisher");
  let existingSlugs = new Set<string>();
  if (options.includeOnboarding) {
    const [member, onboarding, existingBadges] = await Promise.all([
      db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1),
      getOnboardingProgress(userId),
      db.select({ slug: badgeDefinitions.slug }).from(learnerBadges).innerJoin(badgeDefinitions, eq(learnerBadges.badgeId, badgeDefinitions.id)).where(eq(learnerBadges.userId, userId)),
    ]);
    const requiredOnboardingTasks = ONBOARDING_BADGE_TASKS_BY_ROLE[member[0]?.role ?? "user"] ?? ONBOARDING_BADGE_TASKS_BY_ROLE.user;
    if (requiredOnboardingTasks.every((taskId) => onboarding.completedTaskIds.includes(taskId))) eligible.add("onboarding-complete");
    existingSlugs = new Set(existingBadges.map((badge) => badge.slug));
  }
  for (const badge of catalog.filter((item) => eligible.has(item.slug))) {
    await db.insert(learnerBadges).values({ userId, badgeId: badge.id }).onDuplicateKeyUpdate({ set: { badgeId: badge.id } });
  }
  const overall = Math.round(["python", "html", "css", "javascript"].reduce((sum, courseId) => sum + (progress[courseId] ?? 0), 0) / 4);
  let certificate;
  if (overall >= 90) {
    const existing = await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.certificateType, "web-foundations"))).limit(1);
    if (existing[0]) certificate = existing[0];
    else {
      const verificationCode = `CC-${userId}-${nanoid(16).toUpperCase()}`;
      await db.insert(certificates).values({ userId, certificateType: "web-foundations", verificationCode });
      certificate = (await db.select().from(certificates).where(eq(certificates.verificationCode, verificationCode)).limit(1))[0];
    }
  }
  return {
    badges: await db.select({ badge: badgeDefinitions, awardedAt: learnerBadges.awardedAt }).from(learnerBadges).innerJoin(badgeDefinitions, eq(learnerBadges.badgeId, badgeDefinitions.id)).where(eq(learnerBadges.userId, userId)),
    certificate,
    newlyAwardedSlugs: catalog.filter((item) => eligible.has(item.slug) && !existingSlugs.has(item.slug)).map((item) => item.slug),
  };
}

export async function getCertificateByVerificationCode(verificationCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ certificate: certificates, learner: { id: users.id, name: users.name } }).from(certificates).innerJoin(users, eq(certificates.userId, users.id)).where(and(eq(certificates.verificationCode, verificationCode), isNull(certificates.revokedAt))).limit(1);
  return result[0] ?? undefined;
}

export async function getAchievementsForUser(userId: number) {
  const db = await getDb();
  if (!db) return { badges: [], certificate: undefined };
  return { badges: await db.select({ badge: badgeDefinitions, awardedAt: learnerBadges.awardedAt }).from(learnerBadges).innerJoin(badgeDefinitions, eq(learnerBadges.badgeId, badgeDefinitions.id)).where(eq(learnerBadges.userId, userId)), certificate: (await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.certificateType, "web-foundations"), isNull(certificates.revokedAt))).limit(1))[0] };
}

export async function getPublicProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const profile = await db.select({ id: users.id, name: users.name, displayName: users.displayName, progress: courseProgress }).from(users).leftJoin(courseProgress, eq(courseProgress.userId, users.id)).where(eq(users.id, userId));
  if (!profile.length) return undefined;
  return { id: profile[0].id, name: profile[0].name, displayName: profile[0].displayName, progress: profile.flatMap((row) => row.progress ? [row.progress] : []), ...(await getAchievementsForUser(userId)) };
}

export async function upsertCourseProgress(input: InsertCourseProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(courseProgress).values(input).onDuplicateKeyUpdate({
    set: { progressPercent: input.progressPercent, updatedAt: new Date() },
  });
  await evaluateAndAwardAchievements(input.userId);
  return db.select().from(courseProgress).where(and(eq(courseProgress.userId, input.userId), eq(courseProgress.courseId, input.courseId))).limit(1);
}

export async function saveQuizAttempt(input: {
  userId: number;
  courseId: "python" | "html" | "css" | "javascript";
  lessonId: string;
  score: number;
  totalQuestions: number;
  answers: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(quizAttempts).values({
    userId: input.userId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    score: input.score,
    totalQuestions: input.totalQuestions,
    answersJson: JSON.stringify(input.answers),
  }).onDuplicateKeyUpdate({
    set: {
      score: input.score,
      totalQuestions: input.totalQuestions,
      answersJson: JSON.stringify(input.answers),
      submittedAt: new Date(),
    },
  });
  const result = await db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, input.userId), eq(quizAttempts.lessonId, input.lessonId))).limit(1);
  return result[0];
}

export async function getQuizAttemptForUser(userId: number, lessonId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.lessonId, lessonId))).limit(1);
  return result[0];
}

type CourseId = "python" | "html" | "css" | "javascript";
type LearnerNotificationType = "lesson" | "quiz" | "project";

async function ensureNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(notificationPreferences).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return { db, preferences: result[0] };
}

export async function getNotificationPreferences(userId: number) {
  const { preferences } = await ensureNotificationPreferences(userId);
  return preferences;
}

export async function updateNotificationPreferences(input: {
  userId: number;
  lessonUpdatesEnabled: boolean;
  quizResultsEnabled: boolean;
  projectFeedbackEnabled: boolean;
  emailEnabled: boolean;
  browserPushEnabled: boolean;
}) {
  const { db } = await ensureNotificationPreferences(input.userId);
  await db.update(notificationPreferences).set({
    lessonUpdatesEnabled: input.lessonUpdatesEnabled ? 1 : 0,
    quizResultsEnabled: input.quizResultsEnabled ? 1 : 0,
    projectFeedbackEnabled: input.projectFeedbackEnabled ? 1 : 0,
    emailEnabled: input.emailEnabled ? 1 : 0,
    browserPushEnabled: input.browserPushEnabled ? 1 : 0,
    updatedAt: new Date(),
  }).where(eq(notificationPreferences.userId, input.userId));
  return getNotificationPreferences(input.userId);
}

function preferenceAllows(preferences: { lessonUpdatesEnabled: number; quizResultsEnabled: number; projectFeedbackEnabled: number }, type: LearnerNotificationType) {
  if (type === "lesson") return preferences.lessonUpdatesEnabled === 1;
  if (type === "quiz") return preferences.quizResultsEnabled === 1;
  return preferences.projectFeedbackEnabled === 1;
}

export async function createLearnerNotification(input: {
  userId: number;
  type: LearnerNotificationType;
  title: string;
  content: string;
  href?: string;
}) {
  const { db, preferences } = await ensureNotificationPreferences(input.userId);
  if (!preferences || !preferenceAllows(preferences, input.type)) return undefined;
  await db.insert(learnerNotifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    content: input.content,
    href: input.href ?? null,
  });
  const result = await db.select().from(learnerNotifications).where(eq(learnerNotifications.userId, input.userId)).orderBy(desc(learnerNotifications.createdAt)).limit(1);
  const notification = result[0];
  if (!notification) return undefined;

  const [recipient] = await db.select({ email: users.email }).from(users).where(eq(users.id, input.userId)).limit(1);
  const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, input.userId));
  const outcomes = await deliverLearnerNotification({
    title: notification.title,
    content: notification.content,
    href: notification.href,
    email: recipient?.email,
    emailEnabled: preferences.emailEnabled === 1,
    browserPushEnabled: preferences.browserPushEnabled === 1,
    subscriptions,
  });
  await db.insert(notificationDeliveries).values(outcomes.map((outcome) => ({
    notificationId: notification.id,
    channel: outcome.channel,
    status: outcome.status,
    detail: outcome.detail ?? null,
  })));
  return notification;
}

export async function getPushSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).orderBy(desc(pushSubscriptions.updatedAt)).limit(1);
  return result[0];
}

export async function upsertPushSubscription(input: { userId: number; endpoint: string; p256dh: string; auth: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, input.userId));
  await db.insert(pushSubscriptions).values(input);
  return getPushSubscription(input.userId);
}

export async function clearPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  return { success: true };
}

export async function getLearnerNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learnerNotifications).where(eq(learnerNotifications.userId, userId)).orderBy(desc(learnerNotifications.createdAt));
}

export async function markLearnerNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(learnerNotifications).set({ readAt: new Date() }).where(and(eq(learnerNotifications.id, notificationId), eq(learnerNotifications.userId, userId)));
  const result = await db.select().from(learnerNotifications).where(and(eq(learnerNotifications.id, notificationId), eq(learnerNotifications.userId, userId))).limit(1);
  return result[0];
}

export async function publishLessonNotification(input: { courseId: CourseId; title: string; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const learners = await db.select({ id: users.id }).from(users).where(eq(users.role, "user"));
  const delivered = await Promise.all(learners.map((learner) => createLearnerNotification({
    userId: learner.id,
    type: "lesson",
    title: input.title,
    content: input.content,
    href: `/curriculum?course=${input.courseId}`,
  })));
  return { targeted: learners.length, delivered: delivered.filter(Boolean).length };
}

export async function saveProjectSubmission(input: {
  userId: number;
  courseId: CourseId;
  projectLessonId: string;
  repositoryUrl: string;
  liveUrl?: string;
  summary: string;
  rubricTemplateId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = new Date();
  const existing = await getProjectSubmissionForUser(input.userId, input.courseId);
  const currentVersion = (existing?.currentVersion ?? 0) + 1;
  const activeRubric = input.rubricTemplateId
    ? { id: input.rubricTemplateId }
    : (await db.select({ id: rubricTemplates.id }).from(rubricTemplates).where(and(eq(rubricTemplates.courseId, input.courseId), eq(rubricTemplates.isActive, 1))).limit(1))[0];
  await db.insert(projectSubmissions).values({
    ...input,
    rubricTemplateId: activeRubric?.id ?? null,
    currentVersion,
    liveUrl: input.liveUrl ?? null,
    submittedAt: now,
    updatedAt: now,
  }).onDuplicateKeyUpdate({
    set: {
      projectLessonId: input.projectLessonId,
      repositoryUrl: input.repositoryUrl,
      liveUrl: input.liveUrl ?? null,
      summary: input.summary,
      status: "submitted",
      functionalityScore: null,
      codeQualityScore: null,
      userExperienceScore: null,
      completenessScore: null,
      totalScore: null,
      teacherFeedback: null,
      reviewedBy: null,
      reviewedAt: null,
      rubricTemplateId: activeRubric?.id ?? null,
      currentVersion,
      submittedAt: now,
      updatedAt: now,
    },
  });
  const result = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.userId, input.userId), eq(projectSubmissions.courseId, input.courseId))).limit(1);
  if (result[0]) {
    await db.insert(projectSubmissionVersions).values({
      submissionId: result[0].id,
      versionNumber: currentVersion,
      repositoryUrl: input.repositoryUrl,
      liveUrl: input.liveUrl ?? null,
      summary: input.summary,
    });
    await db.update(projectAttachments).set({ submissionId: result[0].id }).where(and(eq(projectAttachments.userId, input.userId), eq(projectAttachments.courseId, input.courseId), eq(projectAttachments.versionNumber, currentVersion)));
  }
  return result[0];
}

export async function getProjectSubmissionForUser(userId: number, courseId: CourseId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.courseId, courseId))).limit(1);
  return result[0] ?? null;
}

export async function saveProjectAttachment(input: {
  userId: number;
  courseId: CourseId;
  projectLessonId: string;
  fileName: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  previewKind: "image" | "pdf" | "text" | "download";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const submission = await getProjectSubmissionForUser(input.userId, input.courseId);
  const versionNumber = (submission?.currentVersion ?? 0) + 1;
  await db.insert(projectAttachments).values({ ...input, submissionId: submission?.id ?? null, versionNumber });
  const result = await db.select().from(projectAttachments).where(and(eq(projectAttachments.userId, input.userId), eq(projectAttachments.courseId, input.courseId))).orderBy(desc(projectAttachments.createdAt)).limit(1);
  return result[0];
}

export async function getProjectAttachmentsForUser(userId: number, courseId: CourseId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectAttachments).where(and(eq(projectAttachments.userId, userId), eq(projectAttachments.courseId, courseId))).orderBy(desc(projectAttachments.createdAt));
}

export async function getProjectSubmissionHistory(userId: number, courseId: CourseId) {
  const db = await getDb();
  if (!db) return { submission: null, versions: [] };
  const submission = await getProjectSubmissionForUser(userId, courseId);
  if (!submission) return { submission: null, versions: [] };
  const [versions, attachments] = await Promise.all([
    db.select().from(projectSubmissionVersions).where(eq(projectSubmissionVersions.submissionId, submission.id)).orderBy(desc(projectSubmissionVersions.versionNumber)),
    db.select().from(projectAttachments).where(eq(projectAttachments.submissionId, submission.id)).orderBy(desc(projectAttachments.createdAt)),
  ]);
  return {
    submission,
    versions: versions.map((version) => ({ ...version, attachments: attachments.filter((attachment) => attachment.versionNumber === version.versionNumber) })),
  };
}

type VersionAttachment = Awaited<ReturnType<typeof getProjectSubmissionHistory>>["versions"][number]["attachments"][number];

function attachmentNameKey(attachment: VersionAttachment) {
  return attachment.fileName.trim().toLocaleLowerCase();
}

function attachmentFingerprint(attachment: VersionAttachment) {
  return `${attachment.storageKey}:${attachment.mimeType}:${attachment.sizeBytes}`;
}

function safeVersionAttachment(attachment: VersionAttachment) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    url: attachment.url,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    previewKind: attachment.previewKind,
  };
}

function summarizeTextChange(before: string, after: string) {
  const beforeLines = before.split("\n").map((line) => line.trim()).filter(Boolean);
  const afterLines = after.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    added: afterLines.filter((line) => !beforeLines.includes(line)).slice(0, 120),
    removed: beforeLines.filter((line) => !afterLines.includes(line)).slice(0, 120),
  };
}

export async function getProjectSubmissionVersionDiff(input: { userId: number; courseId: CourseId; fromVersion: number; toVersion: number }) {
  if (input.fromVersion === input.toVersion) throw new Error("Хоёр өөр хувилбар сонгоно уу.");
  const history = await getProjectSubmissionHistory(input.userId, input.courseId);
  const from = history.versions.find((version) => version.versionNumber === input.fromVersion);
  const to = history.versions.find((version) => version.versionNumber === input.toVersion);
  if (!from || !to) throw new Error("Сонгосон илгээлтийн хувилбар олдсонгүй.");

  const fromFiles = new Map(from.attachments.map((attachment) => [attachmentNameKey(attachment), attachment]));
  const toFiles = new Map(to.attachments.map((attachment) => [attachmentNameKey(attachment), attachment]));
  return {
    from: { versionNumber: from.versionNumber, createdAt: from.createdAt, repositoryUrl: from.repositoryUrl, liveUrl: from.liveUrl, summary: from.summary },
    to: { versionNumber: to.versionNumber, createdAt: to.createdAt, repositoryUrl: to.repositoryUrl, liveUrl: to.liveUrl, summary: to.summary },
    fields: {
      repositoryUrlChanged: from.repositoryUrl !== to.repositoryUrl,
      liveUrlChanged: from.liveUrl !== to.liveUrl,
      summary: summarizeTextChange(from.summary, to.summary),
    },
    attachments: {
      added: Array.from(toFiles.entries()).filter(([key, attachment]) => {
        const previous = fromFiles.get(key);
        return !previous || attachmentFingerprint(previous) !== attachmentFingerprint(attachment);
      }).map(([, attachment]) => safeVersionAttachment(attachment)),
      removed: Array.from(fromFiles.entries()).filter(([key, attachment]) => {
        const replacement = toFiles.get(key);
        return !replacement || attachmentFingerprint(attachment) !== attachmentFingerprint(replacement);
      }).map(([, attachment]) => safeVersionAttachment(attachment)),
      modified: Array.from(toFiles.entries()).filter(([key, attachment]) => {
        const previous = fromFiles.get(key);
        return previous && attachmentFingerprint(previous) !== attachmentFingerprint(attachment);
      }).map(([key, attachment]) => ({ before: safeVersionAttachment(fromFiles.get(key)!), after: safeVersionAttachment(attachment) })),
      unchanged: Array.from(toFiles.entries()).filter(([key, attachment]) => {
        const previous = fromFiles.get(key);
        return previous && attachmentFingerprint(previous) === attachmentFingerprint(attachment);
      }).map(([, attachment]) => safeVersionAttachment(attachment)),
    },
  };
}

export type RubricCriterion = { id: string; label: string; maxPoints: number; description?: string };

function parseRubricCriteria(criteriaJson: string): RubricCriterion[] {
  try {
    const parsed = JSON.parse(criteriaJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RubricCriterion => {
      if (!item || typeof item !== "object") return false;
      const value = item as Record<string, unknown>;
      return typeof value.id === "string" && typeof value.label === "string" && typeof value.maxPoints === "number";
    });
  } catch {
    return [];
  }
}

export async function getRubricTemplates(courseId: CourseId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(rubricTemplates).where(eq(rubricTemplates.courseId, courseId)).orderBy(desc(rubricTemplates.isActive), desc(rubricTemplates.updatedAt));
  return rows.map((row) => ({ ...row, criteria: parseRubricCriteria(row.criteriaJson) }));
}

export async function createRubricTemplate(input: { courseId: CourseId; name: string; description: string; criteria: RubricCriterion[]; createdBy: number; makeActive: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.makeActive) await db.update(rubricTemplates).set({ isActive: 0 }).where(eq(rubricTemplates.courseId, input.courseId));
  await db.insert(rubricTemplates).values({
    courseId: input.courseId,
    name: input.name,
    description: input.description,
    criteriaJson: JSON.stringify(input.criteria),
    isActive: input.makeActive ? 1 : 0,
    createdBy: input.createdBy,
  });
  const row = (await db.select().from(rubricTemplates).where(and(eq(rubricTemplates.courseId, input.courseId), eq(rubricTemplates.name, input.name))).orderBy(desc(rubricTemplates.id)).limit(1))[0];
  return row ? { ...row, criteria: parseRubricCriteria(row.criteriaJson) } : null;
}

export async function activateRubricTemplate(input: { templateId: number; courseId: CourseId }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(rubricTemplates).set({ isActive: 0 }).where(eq(rubricTemplates.courseId, input.courseId));
  await db.update(rubricTemplates).set({ isActive: 1 }).where(and(eq(rubricTemplates.id, input.templateId), eq(rubricTemplates.courseId, input.courseId)));
  return { success: true };
}

export type RubricTransferTemplate = {
  courseId: CourseId;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  makeActive: boolean;
};

export async function exportRubricTemplates(courseId?: CourseId) {
  const db = await getDb();
  if (!db) return { format: "codecraft-rubric/v1" as const, exportedAt: new Date().toISOString(), templates: [] as RubricTransferTemplate[] };
  const rows = courseId
    ? await db.select().from(rubricTemplates).where(eq(rubricTemplates.courseId, courseId)).orderBy(desc(rubricTemplates.updatedAt))
    : await db.select().from(rubricTemplates).orderBy(desc(rubricTemplates.updatedAt));
  return {
    format: "codecraft-rubric/v1" as const,
    exportedAt: new Date().toISOString(),
    templates: rows.map((row) => ({ courseId: row.courseId as CourseId, name: row.name, description: row.description, criteria: parseRubricCriteria(row.criteriaJson), makeActive: row.isActive === 1 })),
  };
}

export async function importRubricTemplates(input: { templates: RubricTransferTemplate[]; createdBy: number }) {
  const imported = [];
  for (const template of input.templates) {
    const created = await createRubricTemplate({ ...template, createdBy: input.createdBy });
    if (created) imported.push(created);
  }
  return { imported: imported.length, templates: imported };
}

export async function removeProjectAttachment(input: { userId: number; attachmentId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(projectAttachments).where(and(eq(projectAttachments.id, input.attachmentId), eq(projectAttachments.userId, input.userId)));
  return { success: true };
}

export async function getRoleDirectory() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(input: { userId: number; role: "user" | "reviewer" | "teacher" | "admin"; actorId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = (await db.select({ id: users.id, role: users.role, openId: users.openId }).from(users).where(eq(users.id, input.userId)).limit(1))[0];
  if (!existing) throw new Error("Хэрэглэгч олдсонгүй.");
  await db.update(users).set({ role: input.role }).where(and(eq(users.id, input.userId), ne(users.openId, ENV.ownerOpenId)));
  const result = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (input.actorId && existing.openId !== ENV.ownerOpenId && existing.role !== input.role) {
    await appendAuditLog({ actorId: input.actorId, action: "role_change", targetType: "user", targetId: String(input.userId), metadata: { previousRole: existing.role, nextRole: input.role } });
  }
  return result[0];
}

type SafeAuditMetadata = Record<string, string | number | boolean | null | undefined>;

function serializeSafeAuditMetadata(metadata: SafeAuditMetadata) {
  const safeEntries = Object.entries(metadata)
    .filter(([key, value]) => value !== undefined && !/(token|secret|password|credential|authorization|cookie|private.?key)/i.test(key))
    .map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? value.slice(0, 360) : value]);
  const serialized = JSON.stringify(Object.fromEntries(safeEntries));
  return serialized.length <= 2000 ? serialized : JSON.stringify({ note: "Мета мэдээлэл хэт урт байсан тул товчиллоо." });
}

export async function appendAuditLog(input: {
  actorId?: number | null;
  action: "role_change" | "invitation_created" | "invitation_accepted" | "invitation_revoked" | "invitation_email_sent" | "invitation_email_skipped" | "invitation_email_failed" | "rubric_imported" | "rubric_exported" | "onboarding_completed";
  targetType: string;
  targetId?: string | null;
  metadata: SafeAuditMetadata;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(auditLogs).values({
    actorId: input.actorId ?? null,
    action: input.action,
    targetType: input.targetType.slice(0, 80),
    targetId: input.targetId?.slice(0, 160) ?? null,
    metadataJson: serializeSafeAuditMetadata(input.metadata),
  });
}

export async function getAuditLogs(input: { limit: number; offset: number; action?: string; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [
    input.action ? eq(auditLogs.action, input.action) : undefined,
    input.from ? gte(auditLogs.createdAt, input.from) : undefined,
    input.to ? lte(auditLogs.createdAt, input.to) : undefined,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const where = conditions.length ? and(...conditions) : undefined;
  const [items, totalRows] = await Promise.all([
    db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadataJson: auditLogs.metadataJson,
      createdAt: auditLogs.createdAt,
      actor: { id: users.id, name: users.name, displayName: users.displayName, email: users.email },
    }).from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id)).where(where).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)).limit(input.limit).offset(input.offset),
    db.select({ value: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.value ?? 0) };
}

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

async function expirePendingInvitations(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  await db.update(staffInvitations).set({ status: "expired" }).where(and(eq(staffInvitations.status, "pending"), lt(staffInvitations.expiresAt, new Date())));
}

export async function createStaffInvitation(input: { email: string; role: "reviewer" | "teacher"; invitedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await expirePendingInvitations(db);
  const email = normalizeInvitationEmail(input.email);
  const existing = await db.select({ id: staffInvitations.id }).from(staffInvitations).where(and(eq(staffInvitations.email, email), eq(staffInvitations.status, "pending"))).limit(1);
  if (existing[0]) throw new Error("Энэ и-мэйл хаягт хүлээгдэж буй урилга аль хэдийн байна.");
  const token = nanoid(40);
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(staffInvitations).values({ email, role: input.role, tokenHash, invitedBy: input.invitedBy, expiresAt });
  const invitation = (await db.select().from(staffInvitations).where(eq(staffInvitations.tokenHash, tokenHash)).limit(1))[0];
  if (!invitation) throw new Error("Урилга хадгалах үед алдаа гарлаа.");
  await appendAuditLog({ actorId: input.invitedBy, action: "invitation_created", targetType: "staff_invitation", targetId: String(invitation.id), metadata: { emailDomain: email.split("@")[1] ?? "", role: input.role, expiresAt: expiresAt.toISOString() } });
  return { invitation, token };
}

export async function listStaffInvitations() {
  const db = await getDb();
  if (!db) return [];
  await expirePendingInvitations(db);
  const rows = await db.select().from(staffInvitations).orderBy(desc(staffInvitations.createdAt));
  const staffIds = Array.from(new Set(rows.flatMap((row) => [row.invitedBy, row.acceptedBy].filter((id): id is number => typeof id === "number"))));
  const staff = staffIds.length ? await db.select({ id: users.id, name: users.name, displayName: users.displayName, email: users.email }).from(users).where(inArray(users.id, staffIds)) : [];
  const names = new Map(staff.map((person) => [person.id, person.displayName || person.name || person.email || "Нэргүй хэрэглэгч"]));
  return rows.map(({ tokenHash: _tokenHash, ...invitation }) => ({
    ...invitation,
    invitedByName: names.get(invitation.invitedBy) ?? "Нэргүй хэрэглэгч",
    acceptedByName: invitation.acceptedBy ? names.get(invitation.acceptedBy) ?? "Нэргүй хэрэглэгч" : null,
  }));
}

export async function revokeStaffInvitation(input: { id: number; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const invitation = (await db.select().from(staffInvitations).where(eq(staffInvitations.id, input.id)).limit(1))[0];
  if (!invitation) throw new Error("Урилга олдсонгүй.");
  if (invitation.status !== "pending") throw new Error("Зөвхөн хүлээгдэж буй урилгыг цуцалж болно.");
  await db.update(staffInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(staffInvitations.id, input.id), eq(staffInvitations.status, "pending")));
  await appendAuditLog({ actorId: input.actorId, action: "invitation_revoked", targetType: "staff_invitation", targetId: String(input.id), metadata: { emailDomain: invitation.email.split("@")[1] ?? "", role: invitation.role } });
  return { success: true };
}

export async function acceptStaffInvitation(input: { token: string; acceptedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tokenHash = hashInvitationToken(input.token);
  const invitation = (await db.select().from(staffInvitations).where(eq(staffInvitations.tokenHash, tokenHash)).limit(1))[0];
  if (!invitation || invitation.status !== "pending") throw new Error("Урилгын холбоос хүчингүй эсвэл аль хэдийн ашиглагдсан байна.");
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await db.update(staffInvitations).set({ status: "expired" }).where(and(eq(staffInvitations.id, invitation.id), eq(staffInvitations.status, "pending")));
    throw new Error("Урилгын хугацаа дууссан байна.");
  }
  const recipient = (await db.select({ id: users.id, email: users.email, role: users.role, openId: users.openId }).from(users).where(eq(users.id, input.acceptedBy)).limit(1))[0];
  if (!recipient?.email || normalizeInvitationEmail(recipient.email) !== invitation.email) throw new Error("Та урилгад заасан и-мэйл хаягаар нэвтэрсэн эсэхээ шалгана уу.");
  await db.update(staffInvitations).set({ status: "accepted", acceptedBy: input.acceptedBy, acceptedAt: new Date() }).where(and(eq(staffInvitations.id, invitation.id), eq(staffInvitations.status, "pending"), gt(staffInvitations.expiresAt, new Date())));
  const accepted = (await db.select().from(staffInvitations).where(eq(staffInvitations.id, invitation.id)).limit(1))[0];
  if (!accepted || accepted.status !== "accepted" || accepted.acceptedBy !== input.acceptedBy) throw new Error("Урилгыг баталгаажуулах боломжгүй байна.");
  if (recipient.openId !== ENV.ownerOpenId && recipient.role !== "owner") await db.update(users).set({ role: invitation.role }).where(eq(users.id, input.acceptedBy));
  await appendAuditLog({ actorId: input.acceptedBy, action: "invitation_accepted", targetType: "staff_invitation", targetId: String(invitation.id), metadata: { emailDomain: invitation.email.split("@")[1] ?? "", role: invitation.role } });
  return { role: recipient.openId === ENV.ownerOpenId || recipient.role === "owner" ? "owner" : invitation.role };
}

function parseOnboardingTaskIds(value?: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.length <= 80).slice(0, 20) : [];
  } catch {
    return [];
  }
}

export async function getOnboardingProgress(userId: number) {
  const db = await getDb();
  if (!db) return { completedTaskIds: [] as string[] };
  const row = (await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId)).limit(1))[0];
  return { completedTaskIds: parseOnboardingTaskIds(row?.completedTaskIdsJson) };
}

export async function completeOnboardingTask(input: { userId: number; taskId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = await getOnboardingProgress(input.userId);
  const completedTaskIds = Array.from(new Set([...current.completedTaskIds, input.taskId])).slice(0, 20);
  const changed = completedTaskIds.length !== current.completedTaskIds.length;
  await db.insert(onboardingProgress).values({ userId: input.userId, completedTaskIdsJson: JSON.stringify(completedTaskIds) }).onDuplicateKeyUpdate({ set: { completedTaskIdsJson: JSON.stringify(completedTaskIds), updatedAt: new Date() } });
  const newlyAwardedSlugs = changed ? (await evaluateAndAwardAchievements(input.userId, { includeOnboarding: true })).newlyAwardedSlugs : [];
  if (changed) await appendAuditLog({ actorId: input.userId, action: "onboarding_completed", targetType: "onboarding_task", targetId: input.taskId, metadata: { taskId: input.taskId, onboardingBadgeAwarded: newlyAwardedSlugs.includes("onboarding-complete") } });
  return { completedTaskIds, changed, newlyAwardedSlugs };
}

export async function getTeacherDashboard() {
  const db = await getDb();
  if (!db) return { learners: [], submissions: [], weeklyActivity: [], summary: { learnerCount: 0, pendingReviewCount: 0, averageProgress: 0, averageQuizScore: 0 } };
  const [learnerRows, progressRows, attempts, submissions, attachments] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.role, "user")),
    db.select().from(courseProgress),
    db.select().from(quizAttempts),
    db.select({ submission: projectSubmissions, learner: { id: users.id, name: users.name, email: users.email } }).from(projectSubmissions).innerJoin(users, eq(projectSubmissions.userId, users.id)).orderBy(desc(projectSubmissions.updatedAt)),
    db.select().from(projectAttachments).orderBy(desc(projectAttachments.createdAt)),
  ]);
  const learners = learnerRows.map((learner) => {
    const learnerProgress = progressRows.filter((row) => row.userId === learner.id);
    const learnerAttempts = attempts.filter((attempt) => attempt.userId === learner.id);
    const averageProgress = learnerProgress.length ? Math.round(learnerProgress.reduce((sum, row) => sum + row.progressPercent, 0) / 4) : 0;
    const averageQuizScore = learnerAttempts.length ? Math.round(learnerAttempts.reduce((sum, row) => sum + row.score, 0) / learnerAttempts.length) : null;
    const latestQuiz = learnerAttempts.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
    return { ...learner, averageProgress, averageQuizScore, quizCount: learnerAttempts.length, latestQuiz };
  });
  const averageProgress = learners.length ? Math.round(learners.reduce((sum, learner) => sum + learner.averageProgress, 0) / learners.length) : 0;
  const learnersWithScores = learners.filter((learner) => learner.averageQuizScore !== null);
  const averageQuizScore = learnersWithScores.length ? Math.round(learnersWithScores.reduce((sum, learner) => sum + (learner.averageQuizScore ?? 0), 0) / learnersWithScores.length) : 0;
  const startOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const today = startOfDay(new Date());
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(today);
    dayStart.setUTCDate(today.getUTCDate() - (6 - index));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);
    const updatedProgress = progressRows.filter((row) => row.updatedAt >= dayStart && row.updatedAt < dayEnd);
    const dailyAttempts = attempts.filter((attempt) => attempt.submittedAt >= dayStart && attempt.submittedAt < dayEnd);
    return {
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString("mn-MN", { weekday: "short", timeZone: "UTC" }),
      activeLearners: new Set([...updatedProgress.map((row) => row.userId), ...dailyAttempts.map((attempt) => attempt.userId)]).size,
      progressSaves: updatedProgress.length,
      quizAttempts: dailyAttempts.length,
    };
  });
  return {
    learners,
    submissions: submissions.map((item) => ({ ...item, attachments: attachments.filter((attachment) => attachment.submissionId === item.submission.id) })),
    weeklyActivity,
    summary: {
      learnerCount: learners.length,
      pendingReviewCount: submissions.filter(({ submission }) => ["submitted", "in_review"].includes(submission.status)).length,
      averageProgress,
      averageQuizScore,
    },
  };
}

export async function getTeacherGradeReport() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    submissionId: projectSubmissions.id,
    courseId: projectSubmissions.courseId,
    status: projectSubmissions.status,
    totalScore: projectSubmissions.totalScore,
    reviewedAt: projectSubmissions.reviewedAt,
    submittedAt: projectSubmissions.submittedAt,
    version: projectSubmissions.currentVersion,
    learnerName: users.name,
    learnerEmail: users.email,
  }).from(projectSubmissions).innerJoin(users, eq(projectSubmissions.userId, users.id)).orderBy(desc(projectSubmissions.reviewedAt), desc(projectSubmissions.submittedAt));
  return rows.map((row) => ({ ...row, learnerName: row.learnerName ?? "Нэргүй суралцагч", learnerEmail: row.learnerEmail ?? "" }));
}

export async function getNotificationAnalytics() {
  const db = await getDb();
  if (!db) return { total: 0, read: 0, unread: 0, deliveries: { email: { sent: 0, failed: 0, skipped: 0 }, push: { sent: 0, failed: 0, skipped: 0 } } };
  const [notifications, deliveries] = await Promise.all([db.select().from(learnerNotifications), db.select().from(notificationDeliveries)]);
  const count = (channel: "email" | "push", status: "sent" | "failed" | "skipped") => deliveries.filter((delivery) => delivery.channel === channel && delivery.status === status).length;
  return {
    total: notifications.length,
    read: notifications.filter((notification) => notification.readAt !== null).length,
    unread: notifications.filter((notification) => notification.readAt === null).length,
    deliveries: {
      email: { sent: count("email", "sent"), failed: count("email", "failed"), skipped: count("email", "skipped") },
      push: { sent: count("push", "sent"), failed: count("push", "failed"), skipped: count("push", "skipped") },
    },
  };
}

export async function reviewProjectSubmission(input: {
  submissionId: number;
  reviewerId: number;
  status: "needs_revision" | "approved";
  functionalityScore: number;
  codeQualityScore: number;
  userExperienceScore: number;
  completenessScore: number;
  teacherFeedback: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const totalScore = input.functionalityScore + input.codeQualityScore + input.userExperienceScore + input.completenessScore;
  await db.update(projectSubmissions).set({
    status: input.status,
    functionalityScore: input.functionalityScore,
    codeQualityScore: input.codeQualityScore,
    userExperienceScore: input.userExperienceScore,
    completenessScore: input.completenessScore,
    totalScore,
    teacherFeedback: input.teacherFeedback,
    reviewedBy: input.reviewerId,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(projectSubmissions.id, input.submissionId));
  const result = await db.select().from(projectSubmissions).where(eq(projectSubmissions.id, input.submissionId)).limit(1);
  const submission = result[0];
  if (submission) {
    await createLearnerNotification({
      userId: submission.userId,
      type: "project",
      title: "Төслийн үнэлгээ шинэчлэгдлээ",
      content: `${submission.courseId.toUpperCase()} төслийн үнэлгээ: ${totalScore}/100. ${input.status === "approved" ? "Баталгаажлаа." : "Засварын саналтай байна."}`,
      href: `/projects/${submission.courseId}`,
    });
  }
  return submission;
}
