import { CheckCircle2, MessageSquarePlus, MessagesSquare, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CourseModule } from "@/lib/courseData";
import { trpc } from "@/lib/trpc";

type ReplyAction = { discussionId: number; body: string };
type StatusAction = { discussionId: number; status: "open" | "resolved" };

export function CourseDiscussion({ course }: { course: CourseModule }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [failedReply, setFailedReply] = useState<ReplyAction | null>(null);
  const [failedStatus, setFailedStatus] = useState<StatusAction | null>(null);
  const discussions = trpc.discussions.list.useQuery({ courseId: course.id, lessonId: course.lessonId });
  const create = trpc.discussions.create.useMutation({ onSuccess: async () => { setTopic(""); setBody(""); setNotice("Хэлэлцүүлэг амжилттай нээгдлээ."); await utils.discussions.list.invalidate(); } });
  const reply = trpc.discussions.reply.useMutation({ onSuccess: async () => { setReplyDrafts({}); setFailedReply(null); setNotice("Хариулт нэмэгдлээ."); await utils.discussions.list.invalidate(); } });
  const setStatus = trpc.discussions.setStatus.useMutation({ onSuccess: async () => { setFailedStatus(null); setNotice("Хэлэлцүүлгийн төлөв шинэчлэгдлээ."); await utils.discussions.list.invalidate(); } });
  const rows = discussions.data ?? [];

  function submitReply(action: ReplyAction) {
    setNotice(null);
    setFailedReply(null);
    reply.mutate(action, { onError: () => setFailedReply(action) });
  }

  function updateStatus(action: StatusAction) {
    setNotice(null);
    setFailedStatus(null);
    setStatus.mutate(action, { onError: () => setFailedStatus(action) });
  }

  return <section className="course-discussion"><div className="discussion-heading"><div><p className="section-kicker">СЭТГЭГДЭЛ · ХЭЛЭЛЦҮҮЛЭГ</p><h3>Санаагаа хуваалцаж, хамтдаа задла.</h3><p>Энэ хичээлийн доор өөрийн туршилт, асуулт, тайлбараа үлдээгээрэй. Жинхэнэ суралцагчдын хэлэлцүүлэг л энд харагдана.</p></div><MessagesSquare /></div><div className="discussion-compose"><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Хэлэлцүүлгийн товч гарчиг" aria-label="Хэлэлцүүлгийн гарчиг" /><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Туршсан код, ойлгосон зүйл эсвэл асуултаа дэлгэрэнгүй бичээрэй..." aria-label="Хэлэлцүүлгийн агуулга" /><Button className="atlas-button" disabled={topic.trim().length < 4 || body.trim().length < 10 || create.isPending} onClick={() => create.mutate({ courseId: course.id, lessonId: course.lessonId, topic, body })}><MessageSquarePlus size={16} /> {create.isPending ? "Нээж байна..." : "Хэлэлцүүлэг нээх"}</Button></div>{notice && <p className="discussion-feedback" role="status">{notice}</p>}{create.error && <div className="persistence-error" role="alert"><span>Хэлэлцүүлгийг нээж чадсангүй.</span><button type="button" onClick={() => create.mutate({ courseId: course.id, lessonId: course.lessonId, topic, body })}>Дахин оролдох</button></div>}{failedReply && <div className="persistence-error" role="alert"><span>Хариултыг илгээж чадсангүй.</span><button type="button" onClick={() => submitReply(failedReply)}>Дахин илгээх</button></div>}{failedStatus && <div className="persistence-error" role="alert"><span>Хэлэлцүүлгийн төлвийг шинэчилж чадсангүй.</span><button type="button" onClick={() => updateStatus(failedStatus)}>Дахин оролдох</button></div>}{discussions.isLoading ? <p className="discussion-state">Хэлэлцүүлгүүдийг ачаалж байна...</p> : discussions.error ? <div className="persistence-error"><span>Хэлэлцүүлгийг ачаалж чадсангүй.</span><button type="button" onClick={() => discussions.refetch()}>Дахин ачаалах</button></div> : rows.length === 0 ? <div className="discussion-empty"><MessagesSquare size={20} /><p>Энэ хичээлд хэлэлцүүлэг эхлээгүй байна. Та эхний санаагаа хуваалцаарай.</p></div> : <div className="discussion-thread-list">{rows.map((thread) => <article key={thread.id} className="discussion-thread"><div className="thread-author"><UserRound size={15} /><span>{thread.authorName || "Суралцагч"}</span><small>{new Date(thread.createdAt).toLocaleDateString()}</small><b className={thread.status === "resolved" ? "status answered" : "status"}>{thread.status === "resolved" ? "Шийдэгдсэн" : "Нээлттэй"}</b></div><h4>{thread.topic}</h4><p>{thread.body}</p>{(user?.role === "admin" || user?.id === thread.userId) && <div className="discussion-thread-actions"><button type="button" disabled={setStatus.isPending} onClick={() => updateStatus({ discussionId: thread.id, status: thread.status === "open" ? "resolved" : "open" })}>{thread.status === "open" ? <><CheckCircle2 size={14} /> Шийдэгдсэн болгох</> : "Нээх"}</button></div>}{thread.replies.map((item) => <div key={item.id} className="thread-reply"><UserRound size={14} /><div><span>{item.authorName || "Суралцагч"}</span><p>{item.body}</p></div></div>)}<div className="reply-composer"><Textarea value={replyDrafts[thread.id] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))} placeholder="Хариу, туршлага, тусламж бичих" aria-label="Хэлэлцүүлгийн хариулт" /><Button variant="outline" size="sm" disabled={(replyDrafts[thread.id]?.trim().length ?? 0) < 2 || reply.isPending} onClick={() => submitReply({ discussionId: thread.id, body: replyDrafts[thread.id] ?? "" })}><Send size={14} /> Хариулах</Button></div></article>)}</div>}</section>;
}
