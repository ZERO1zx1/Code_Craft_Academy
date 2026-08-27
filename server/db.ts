import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  assignments,
  assignmentSubmissions,
  certificates,
  courseContent,
  courseQuestions,
  discussionReplies,
  feedbackMessages,
  feedbackThreads,
  InsertUser,
  lessonDiscussions,
  lessonProgress,
  questionReplies,
  quizAttempts,
  notifications,
  users,
} from "../drizzle/schema";
import { evaluateCertificateEligibility } from "./certificateEligibility";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Сургалтын өгөгдлийн сан одоогоор холбогдоогүй байна.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) { const value = user[field] ?? null; values[field] = value; updateSet[field] = value; }
  });
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getLearningOverview(userId: number) {
  const db = await requireDb();
  const [progress, attempts] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.createdAt)),
  ]);
  return { progress, attempts };
}

export async function listCourseContent(includeUnpublished = false) {
  const db = await requireDb();
  return includeUnpublished
    ? db.select().from(courseContent).orderBy(asc(courseContent.courseId))
    : db.select().from(courseContent).where(eq(courseContent.isPublished, true)).orderBy(asc(courseContent.courseId));
}

export async function updateCourseContent(userId: number, input: {
  courseId: string; title: string; description: string; durationMinutes: number; lessonCount: number; learningGoal: string | null; isPublished: boolean;
}) {
  const db = await requireDb();
  await db.insert(courseContent).values({ ...input, updatedBy: userId }).onDuplicateKeyUpdate({ set: { ...input, updatedBy: userId, updatedAt: new Date() } });
  return (await db.select().from(courseContent).where(eq(courseContent.courseId, input.courseId)).limit(1))[0];
}

export async function getCertificateStatus(userId: number) {
  const db = await requireDb();
  const [courses, progress, attempts, existing] = await Promise.all([
    db.select({ courseId: courseContent.courseId }).from(courseContent).where(eq(courseContent.isPublished, true)),
    db.select({ courseId: lessonProgress.courseId, state: lessonProgress.state }).from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select({ courseId: quizAttempts.courseId, passed: quizAttempts.passed }).from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db.select().from(certificates).where(eq(certificates.userId, userId)).limit(1),
  ]);
  const eligibility = evaluateCertificateEligibility({
    requiredCourseIds: courses.map((course) => course.courseId),
    completedCourseIds: progress.filter((item) => item.state === "completed").map((item) => item.courseId),
    passedCourseIds: attempts.filter((item) => item.passed).map((item) => item.courseId),
  });
  return { ...eligibility, certificate: existing[0] ?? null };
}

export async function issueCertificateIfEligible(userId: number) {
  const db = await requireDb();
  const status = await getCertificateStatus(userId);
  if (status.certificate || !status.eligible) return status;
  const credentialId = `CCA-${nanoid(10).toUpperCase()}`;
  await db.insert(certificates).values({ userId, credentialId, completionSnapshot: {
    courseIds: status.requiredCourseIds, completedCourseIds: status.completedCourseIds, passedCourseIds: status.passedCourseIds,
  } });
  await createNotification(userId, { type: "certificate_issued", title: "Сертификат бэлэн боллоо", body: "Таны бүх сургалтын шаардлага хангагдсан тул CodeCraft Academy сертификат үүслээ.", actionUrl: "/certificate" });
  const certificate = (await db.select().from(certificates).where(eq(certificates.userId, userId)).limit(1))[0] ?? null;
  return { ...status, certificate };
}

export async function markLessonProgress(userId: number, input: { courseId: string; lessonId: string; state: "in_progress" | "completed" }) {
  const db = await requireDb();
  const completedAt = input.state === "completed" ? new Date() : null;
  await db.insert(lessonProgress).values({ ...input, userId, completedAt }).onDuplicateKeyUpdate({ set: { state: input.state, completedAt, updatedAt: new Date() } });
  const certificate = input.state === "completed" ? await issueCertificateIfEligible(userId) : undefined;
  if (input.state === "completed") await createNotification(userId, { type: "quest_unlocked", title: "Quest дууслаа", body: `${input.courseId.toUpperCase()} хичээлийн нэг quest амжилттай дууслаа.`, actionUrl: `/learn/${input.courseId}` });
  return { ...input, completedAt, certificate };
}

export async function saveQuizAttempt(userId: number, input: { courseId: string; lessonId: string; score: number; total: number; passed: boolean; answers: number[] }) {
  const db = await requireDb();
  await db.insert(quizAttempts).values({ ...input, userId });
  const progress = input.passed ? await markLessonProgress(userId, { courseId: input.courseId, lessonId: input.lessonId, state: "completed" }) : undefined;
  return { ...input, completedAt: new Date(), certificate: progress?.certificate };
}

export async function listCourseQuestions(courseId: string, lessonId: string) {
  const db = await requireDb();
  const questions = await db.select({ id: courseQuestions.id, body: courseQuestions.body, status: courseQuestions.status, createdAt: courseQuestions.createdAt, authorName: users.name }).from(courseQuestions).leftJoin(users, eq(courseQuestions.userId, users.id)).where(and(eq(courseQuestions.courseId, courseId), eq(courseQuestions.lessonId, lessonId))).orderBy(desc(courseQuestions.createdAt));
  if (questions.length === 0) return [];
  const replies = await db.select({ id: questionReplies.id, questionId: questionReplies.questionId, body: questionReplies.body, createdAt: questionReplies.createdAt, authorName: users.name }).from(questionReplies).leftJoin(users, eq(questionReplies.userId, users.id)).where(inArray(questionReplies.questionId, questions.map((question) => question.id))).orderBy(questionReplies.createdAt);
  return questions.map((question) => ({ ...question, replies: replies.filter((reply) => reply.questionId === question.id) }));
}

export async function createCourseQuestion(userId: number, input: { courseId: string; lessonId: string; body: string }) {
  const db = await requireDb();
  const result = await db.insert(courseQuestions).values({ ...input, userId });
  return { id: result[0].insertId, ...input };
}

export async function createQuestionReply(userId: number, input: { questionId: number; body: string }) {
  const db = await requireDb();
  const result = await db.insert(questionReplies).values({ ...input, userId });
  await db.update(courseQuestions).set({ status: "answered", updatedAt: new Date() }).where(eq(courseQuestions.id, input.questionId));
  return { id: result[0].insertId, ...input };
}

export async function listLessonDiscussions(courseId: string, lessonId: string) {
  const db = await requireDb();
  const discussions = await db.select({ id: lessonDiscussions.id, userId: lessonDiscussions.userId, topic: lessonDiscussions.topic, body: lessonDiscussions.body, status: lessonDiscussions.status, createdAt: lessonDiscussions.createdAt, authorName: users.name }).from(lessonDiscussions).leftJoin(users, eq(lessonDiscussions.userId, users.id)).where(and(eq(lessonDiscussions.courseId, courseId), eq(lessonDiscussions.lessonId, lessonId))).orderBy(desc(lessonDiscussions.createdAt));
  if (discussions.length === 0) return [];
  const replies = await db.select({ id: discussionReplies.id, discussionId: discussionReplies.discussionId, userId: discussionReplies.userId, body: discussionReplies.body, createdAt: discussionReplies.createdAt, authorName: users.name }).from(discussionReplies).leftJoin(users, eq(discussionReplies.userId, users.id)).where(inArray(discussionReplies.discussionId, discussions.map((item) => item.id))).orderBy(discussionReplies.createdAt);
  return discussions.map((discussion) => ({ ...discussion, replies: replies.filter((reply) => reply.discussionId === discussion.id) }));
}

export async function createLessonDiscussion(userId: number, input: { courseId: string; lessonId: string; topic: string; body: string }) {
  const db = await requireDb();
  const result = await db.insert(lessonDiscussions).values({ ...input, userId });
  return { id: result[0].insertId, ...input };
}

export async function createDiscussionReply(userId: number, input: { discussionId: number; body: string }) {
  const db = await requireDb();
  const result = await db.insert(discussionReplies).values({ ...input, userId });
  return { id: result[0].insertId, ...input };
}

export async function setDiscussionStatus(actorId: number, isAdmin: boolean, input: { discussionId: number; status: "open" | "resolved" }) {
  const db = await requireDb();
  const discussion = (await db.select({ userId: lessonDiscussions.userId }).from(lessonDiscussions).where(eq(lessonDiscussions.id, input.discussionId)).limit(1))[0];
  if (!discussion) throw new Error("Хэлэлцүүлэг олдсонгүй.");
  if (!isAdmin && discussion.userId !== actorId) throw new Error("Зөвхөн хэлэлцүүлэг үүсгэсэн суралцагч эсвэл багш төлвийг өөрчилнө.");
  await db.update(lessonDiscussions).set({ status: input.status, updatedAt: new Date() }).where(eq(lessonDiscussions.id, input.discussionId));
  return input;
}

export async function getTeacherOverview() {
  const db = await requireDb();
  const [courses, learners, progress, attempts, discussions, assignmentRows, submissionRows] = await Promise.all([
    db.select().from(courseContent).orderBy(asc(courseContent.courseId)),
    db.select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.role, "user")).orderBy(desc(users.lastSignedIn)).limit(200),
    db.select({ userId: lessonProgress.userId, courseId: lessonProgress.courseId, state: lessonProgress.state, updatedAt: lessonProgress.updatedAt }).from(lessonProgress).orderBy(desc(lessonProgress.updatedAt)).limit(1000),
    db.select({ userId: quizAttempts.userId, courseId: quizAttempts.courseId, score: quizAttempts.score, total: quizAttempts.total, passed: quizAttempts.passed, createdAt: quizAttempts.createdAt }).from(quizAttempts).orderBy(desc(quizAttempts.createdAt)).limit(1000),
    db.select({ id: lessonDiscussions.id, courseId: lessonDiscussions.courseId, lessonId: lessonDiscussions.lessonId, topic: lessonDiscussions.topic, status: lessonDiscussions.status, createdAt: lessonDiscussions.createdAt }).from(lessonDiscussions).orderBy(desc(lessonDiscussions.createdAt)).limit(200),
    db.select().from(assignments).orderBy(desc(assignments.createdAt)).limit(200),
    db.select().from(assignmentSubmissions).orderBy(desc(assignmentSubmissions.updatedAt)).limit(1000),
  ]);
  return { courses, learners, progress, attempts, discussions, assignments: assignmentRows, submissions: submissionRows };
}

export async function updateLearnerProgressAsAdmin(input: { userId: number; courseId: string; lessonId: string; state: "in_progress" | "completed" }) {
  return markLessonProgress(input.userId, input);
}

export async function listLearnerAssignments(userId: number) {
  const db = await requireDb();
  const [rows, submissions] = await Promise.all([
    db.select().from(assignments).where(eq(assignments.status, "published")).orderBy(desc(assignments.createdAt)),
    db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.userId, userId)).orderBy(desc(assignmentSubmissions.updatedAt)),
  ]);
  return rows.map((assignment) => ({ ...assignment, submission: submissions.find((item) => item.assignmentId === assignment.id) ?? null }));
}

export async function submitAssignment(userId: number, input: { assignmentId: number; response: string; resourceUrl: string | null }) {
  const db = await requireDb();
  const assignment = (await db.select().from(assignments).where(eq(assignments.id, input.assignmentId)).limit(1))[0];
  if (!assignment || assignment.status !== "published") throw new Error("Энэ даалгавар илгээлт хүлээж авахгүй байна.");
  const existing = (await db.select().from(assignmentSubmissions).where(and(eq(assignmentSubmissions.assignmentId, input.assignmentId), eq(assignmentSubmissions.userId, userId))).limit(1))[0];
  const state = existing?.state === "graded" ? "revised" : "submitted";
  await db.insert(assignmentSubmissions).values({ ...input, userId, state }).onDuplicateKeyUpdate({ set: { response: input.response, resourceUrl: input.resourceUrl, state, score: null, feedback: null, gradedBy: null, gradedAt: null, submittedAt: new Date(), updatedAt: new Date() } });
  return (await db.select().from(assignmentSubmissions).where(and(eq(assignmentSubmissions.assignmentId, input.assignmentId), eq(assignmentSubmissions.userId, userId))).limit(1))[0];
}

export async function gradeAssignmentSubmission(teacherId: number, input: { submissionId: number; score: number; feedback: string }) {
  const db = await requireDb();
  const submission = (await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.id, input.submissionId)).limit(1))[0];
  if (!submission) throw new Error("Илгээлт олдсонгүй.");
  const assignment = (await db.select().from(assignments).where(eq(assignments.id, submission.assignmentId)).limit(1))[0];
  if (!assignment) throw new Error("Даалгавар олдсонгүй.");
  if (input.score > assignment.maxScore) throw new Error(`Оноо ${assignment.maxScore}-аас хэтрэхгүй байх ёстой.`);
  await db.update(assignmentSubmissions).set({ score: input.score, feedback: input.feedback, state: "graded", gradedBy: teacherId, gradedAt: new Date(), updatedAt: new Date() }).where(eq(assignmentSubmissions.id, input.submissionId));
  await createNotification(submission.userId, { type: "assignment_graded", title: "Даалгавар үнэлэгдлээ", body: `Таны даалгаварт ${input.score}/${assignment.maxScore} оноо болон багшийн feedback ирлээ.`, actionUrl: "/learn" });
  return (await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.id, input.submissionId)).limit(1))[0];
}

export async function createAssignment(teacherId: number, input: { courseId: string; lessonId: string; title: string; instructions: string; criteria: string | null; maxScore: number; dueAt: Date | null; status: "draft" | "published" | "closed" }) {
  const db = await requireDb();
  const result = await db.insert(assignments).values({ ...input, createdBy: teacherId });
  return (await db.select().from(assignments).where(eq(assignments.id, result[0].insertId)).limit(1))[0];
}

export async function getLearnerAnalytics(userId: number) {
  const db = await requireDb();
  const [courses, progress, attempts, learnerAssignments] = await Promise.all([
    db.select({ courseId: courseContent.courseId, title: courseContent.title }).from(courseContent).where(eq(courseContent.isPublished, true)).orderBy(asc(courseContent.courseId)),
    db.select({ courseId: lessonProgress.courseId, state: lessonProgress.state, updatedAt: lessonProgress.updatedAt }).from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select({ courseId: quizAttempts.courseId, score: quizAttempts.score, total: quizAttempts.total, passed: quizAttempts.passed, createdAt: quizAttempts.createdAt }).from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(asc(quizAttempts.createdAt)),
    listLearnerAssignments(userId),
  ]);
  return { courses, progress, attempts, assignments: learnerAssignments };
}

export async function createNotification(userId: number, input: { type: "feedback_reply" | "assignment_graded" | "quest_unlocked" | "certificate_issued"; title: string; body: string; actionUrl?: string | null }) {
  const db = await requireDb();
  const result = await db.insert(notifications).values({ userId, ...input, actionUrl: input.actionUrl ?? null });
  return { id: result[0].insertId, userId, ...input };
}

export async function listNotifications(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(60);
  return { rows, unreadCount: rows.filter((notification) => notification.readAt === null).length };
}

export async function markNotificationsRead(userId: number, notificationIds?: number[]) {
  const db = await requireDb();
  const filter = notificationIds?.length ? and(eq(notifications.userId, userId), inArray(notifications.id, notificationIds)) : eq(notifications.userId, userId);
  await db.update(notifications).set({ readAt: new Date() }).where(filter);
  return { success: true } as const;
}

async function getPrimaryTeacherId() {
  const db = await requireDb();
  const teacher = (await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).orderBy(asc(users.id)).limit(1))[0];
  if (!teacher) throw new Error("Одоогоор feedback хүлээн авах багшийн account олдсонгүй.");
  return teacher.id;
}

export async function listFeedbackThreads(userId: number, role: "user" | "admin") {
  const db = await requireDb();
  const condition = role === "admin" ? eq(feedbackThreads.teacherId, userId) : eq(feedbackThreads.learnerId, userId);
  const threads = await db.select().from(feedbackThreads).where(condition).orderBy(desc(feedbackThreads.updatedAt)).limit(100);
  if (!threads.length) return [];
  const messages = await db.select().from(feedbackMessages).where(inArray(feedbackMessages.threadId, threads.map((thread) => thread.id))).orderBy(asc(feedbackMessages.createdAt));
  return threads.map((thread) => ({ ...thread, messages: messages.filter((message) => message.threadId === thread.id) }));
}

export async function createFeedbackThread(learnerId: number, input: { courseId?: string | null; lessonId?: string | null; submissionId?: number | null; subject: string; body: string }) {
  const db = await requireDb();
  const teacherId = await getPrimaryTeacherId();
  const result = await db.insert(feedbackThreads).values({ learnerId, teacherId, courseId: input.courseId ?? null, lessonId: input.lessonId ?? null, submissionId: input.submissionId ?? null, subject: input.subject });
  const threadId = result[0].insertId;
  await db.insert(feedbackMessages).values({ threadId, senderId: learnerId, body: input.body });
  await createNotification(teacherId, { type: "feedback_reply", title: "Шинэ суралцагчийн хүсэлт", body: input.subject, actionUrl: "/admin" });
  return { id: threadId, learnerId, teacherId, ...input };
}

export async function replyToFeedbackThread(senderId: number, role: "user" | "admin", input: { threadId: number; body: string }) {
  const db = await requireDb();
  const thread = (await db.select().from(feedbackThreads).where(eq(feedbackThreads.id, input.threadId)).limit(1))[0];
  if (!thread) throw new Error("Feedback thread олдсонгүй.");
  const permitted = role === "admin" ? thread.teacherId === senderId : thread.learnerId === senderId;
  if (!permitted) throw new Error("Энэ feedback thread-д хариу илгээх эрхгүй байна.");
  const result = await db.insert(feedbackMessages).values({ threadId: input.threadId, senderId, body: input.body });
  const recipientId = senderId === thread.learnerId ? thread.teacherId : thread.learnerId;
  await db.update(feedbackThreads).set({ status: "open", updatedAt: new Date() }).where(eq(feedbackThreads.id, input.threadId));
  await createNotification(recipientId, { type: "feedback_reply", title: "Шинэ feedback хариу", body: input.body.slice(0, 160), actionUrl: role === "admin" ? "/learn" : "/admin" });
  return { id: result[0].insertId, ...input };
}

export async function markFeedbackMessagesRead(userId: number, role: "user" | "admin", threadId: number) {
  const db = await requireDb();
  const thread = (await db.select().from(feedbackThreads).where(eq(feedbackThreads.id, threadId)).limit(1))[0];
  if (!thread || (role === "admin" ? thread.teacherId !== userId : thread.learnerId !== userId)) throw new Error("Feedback thread олдсонгүй.");
  await db.update(feedbackMessages).set({ readAt: new Date() }).where(and(eq(feedbackMessages.threadId, threadId), eq(feedbackMessages.senderId, role === "admin" ? thread.learnerId : thread.teacherId)));
  return { success: true } as const;
}
