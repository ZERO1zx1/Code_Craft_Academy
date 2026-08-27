/** Code Atlas Editorial: every authentic learner question is stored and discussed in context. */
import { CornerDownRight, MessageCircle, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { CourseModule } from "@/lib/courseData";

export function QuestionBoard({ course }: { course: CourseModule }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failedReply, setFailedReply] = useState<{ questionId: number; body: string } | null>(null);
  const questionsQuery = trpc.questions.list.useQuery({ courseId: course.id, lessonId: course.lessonId });
  const createQuestion = trpc.questions.create.useMutation({ onSuccess: async () => { setDraft(""); setFeedback("Асуулт амжилттай нэмэгдлээ."); await utils.questions.list.invalidate(); } });
  const replyQuestion = trpc.questions.reply.useMutation({ onSuccess: async () => { setReplyDrafts({}); setFailedReply(null); setFeedback("Хариулт амжилттай нэмэгдлээ."); await utils.questions.list.invalidate(); } });
  const questions = questionsQuery.data ?? [];

  function submitReply(questionId: number, body: string) {
    setFeedback(null);
    replyQuestion.mutate({ questionId, body }, { onError: () => setFailedReply({ questionId, body }) });
  }

  return (
    <section className="question-board">
      <div className="question-board-header"><div><p className="section-kicker">АСУУЛТ · ХАРИУЛТ</p><h3>Энэ хичээл дээр гацсан уу?</h3><p>Асуултаа хичээлийн контексттэй нь хамт үлдээгээрэй. Хариулт бүр суралцах урсгалыг чинь үргэлжлүүлнэ.</p></div><MessageCircle className="question-icon" /></div>
      <div className="ask-box"><Textarea value={draft} onChange={(event) => { setDraft(event.target.value); setFeedback(null); }} placeholder="Жишээ нь: `section` ба `div`-ийг хэзээ ялгаж хэрэглэх вэ?" aria-label="Шинэ асуулт" /><Button className="atlas-button" disabled={draft.trim().length < 8 || createQuestion.isPending} onClick={() => createQuestion.mutate({ courseId: course.id, lessonId: course.lessonId, body: draft })}><Send size={16} /> {createQuestion.isPending ? "Илгээж байна" : "Асуулт илгээх"}</Button></div>
      {feedback && <p className="discussion-feedback" role="status">{feedback}</p>}
      {createQuestion.error && <div className="persistence-error" role="alert"><span>Асуултыг илгээж чадсангүй. Дахин оролдоорой.</span><button type="button" onClick={() => createQuestion.mutate({ courseId: course.id, lessonId: course.lessonId, body: draft })}>Дахин илгээх</button></div>}
      {replyQuestion.error && <div className="persistence-error" role="alert"><span>Хариултыг илгээж чадсангүй. Дахин оролдоорой.</span>{failedReply && <button type="button" onClick={() => submitReply(failedReply.questionId, failedReply.body)}>Дахин илгээх</button>}</div>}
      {questionsQuery.isLoading ? <p className="discussion-state">Асуултуудыг ачаалж байна...</p> : questionsQuery.error ? <div className="persistence-error" role="alert"><span>Асуултуудыг ачаалж чадсангүй.</span><button type="button" onClick={() => questionsQuery.refetch()}>Дахин ачаалах</button></div> : questions.length === 0 ? <div className="discussion-empty"><MessageCircle size={20} /><p>Энэ хичээлд асуулт алга байна. Та эхний асуултаа асуугаарай.</p></div> : <div className="discussion-list">{questions.map((question) => <article key={question.id} className="question-thread"><div className="thread-author"><UserRound size={15} /><span>{question.authorName || "Суралцагч"}</span><small>{new Date(question.createdAt).toLocaleDateString()}</small><b className={question.status === "answered" ? "status answered" : "status"}>{question.status === "answered" ? "Хариулттай" : "Нээлттэй"}</b></div><p>{question.body}</p>{question.replies.map((reply) => <div key={reply.id} className="thread-reply"><CornerDownRight size={15} /><div><span>{reply.authorName || "Суралцагч"}</span><p>{reply.body}</p></div></div>)}<div className="reply-composer"><Textarea value={replyDrafts[question.id] ?? ""} onChange={(event) => { setReplyDrafts((current) => ({ ...current, [question.id]: event.target.value })); setFeedback(null); }} placeholder="Товч, хэрэгтэй хариулт бичээрэй" aria-label="Хариулт бичих" /><Button variant="outline" size="sm" disabled={(replyDrafts[question.id]?.trim().length ?? 0) < 2 || replyQuestion.isPending} onClick={() => submitReply(question.id, replyDrafts[question.id] ?? "")}>Хариулах</Button></div></article>)}</div>}
    </section>
  );
}
