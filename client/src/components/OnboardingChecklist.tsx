import { CheckCircle2, Circle, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type OnboardingTask = { id: string; title: string; description: string; href: string; linkLabel: string };

const tasksByRole: Record<string, OnboardingTask[]> = {
  user: [
    { id: "profile-finish", title: "Профайлаа тохируулах", description: "Дэлгэцэнд харагдах нэрээ засч, таны профайл юу харуулахыг шалгана уу.", href: "/profile", linkLabel: "Профайл нээх" },
    { id: "first-lesson", title: "Эхний хичээлээ сонгох", description: "Сургалтын хөтөлбөрөөс нэг хичээл сонгож, замналаа эхлүүлээрэй.", href: "/curriculum", linkLabel: "Хөтөлбөр нээх" },
    { id: "editor-open", title: "Кодын орчныг турших", description: "Жишээ кодоо ажиллуулаад AI туслахаас алхамчилсан чиглэл аваарай.", href: "/workspace", linkLabel: "Кодын орчин нээх" },
  ],
  reviewer: [
    { id: "reviewer-dashboard", title: "Шалгагчийн самбарыг нээх", description: "Илгээсэн төслүүд, суралцагчдын мэдээлэлтэй танилцана уу.", href: "/teacher", linkLabel: "Удирдлагын самбар" },
    { id: "reviewer-review", title: "Үнэлгээний урсгалыг судлах", description: "Төслийн хувилбар, хавсралт, үнэлгээний шалгуурыг зөв ашиглах зааврыг уншина уу.", href: "/teacher", linkLabel: "Төслийн үнэлгээ" },
    { id: "notification-inbox", title: "Мэдэгдлээ шалгах", description: "Сургалтын үйл явцтай холбоотой мэдэгдлээ уншиж хэвшинэ үү.", href: "/notifications", linkLabel: "Мэдэгдэл нээх" },
  ],
  teacher: [
    { id: "teacher-dashboard", title: "Багшийн самбарыг нээх", description: "Суралцагчийн ахиц, шалгалт, төслийн илгээлтийг хянах хэсэгтэй танилцана уу.", href: "/teacher", linkLabel: "Багшийн самбар" },
    { id: "teacher-rubric", title: "Үнэлгээний шалгуур бэлтгэх", description: "Тухайн курсэд 100 онооны жинтэй шалгуурын загвар үүсгээрэй.", href: "/teacher/operations", linkLabel: "Шалгуурын төв" },
    { id: "teacher-publish", title: "Хичээлийн мэдэгдэл илгээх", description: "Шинэ хичээл эсвэл чухал мэдээллийг зөвшөөрөлтэй суралцагчдад хүргэх урсгалыг ашиглана уу.", href: "/teacher", linkLabel: "Самбар нээх" },
  ],
  admin: [
    { id: "owner-operations", title: "Эзэмшигчийн төвтэй танилцах", description: "Системийн удирдлага, үүргийн зааг, үйл ажиллагааны бүртгэлийг шалгана уу.", href: "/teacher/operations", linkLabel: "Эзэмшигчийн төв" },
    { id: "owner-invitations", title: "Ажилтны урилгын урсгал", description: "Зөвхөн шаардлагатай хүнд багш эсвэл шалгагчийн эрхийн урилга үүсгэнэ үү.", href: "/teacher/operations", linkLabel: "Урилга удирдах" },
    { id: "owner-audit", title: "Үйлдлийн түүхийг хянах", description: "Нууц мэдээлэл агуулаагүй системийн үйлдлийн бүртгэлийг тогтмол шалгана уу.", href: "/teacher/operations", linkLabel: "Үйлдлийн түүх" },
  ],
  owner: [
    { id: "owner-operations", title: "Эзэмшигчийн төвтэй танилцах", description: "Системийн удирдлага, үүргийн зааг, үйл ажиллагааны бүртгэлийг шалгана уу.", href: "/teacher/operations", linkLabel: "Эзэмшигчийн төв" },
    { id: "owner-invitations", title: "Ажилтны урилгын урсгал", description: "Зөвхөн шаардлагатай хүнд багш эсвэл шалгагчийн эрхийн урилга үүсгэнэ үү.", href: "/teacher/operations", linkLabel: "Урилга удирдах" },
    { id: "owner-audit", title: "Үйлдлийн түүхийг хянах", description: "Нууц мэдээлэл агуулаагүй системийн үйлдлийн бүртгэлийг тогтмол шалгана уу.", href: "/teacher/operations", linkLabel: "Үйлдлийн түүх" },
  ],
};

export function OnboardingChecklist() {
  const { user, isAuthenticated } = useAuth();
  const tasks = tasksByRole[user?.role ?? "user"] ?? tasksByRole.user;
  const progressQuery = trpc.onboarding.progress.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const completeTask = trpc.onboarding.complete.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.onboarding.progress.invalidate(), utils.profile.public.invalidate()]);
      if (result.newlyAwardedSlugs.includes("onboarding-complete")) toast.success("Баяр хүргэе. “Системтэй танилцсан” тэмдэг нээгдлээ.");
      else toast.success("Танилцах даалгавар хадгалагдлаа.");
    },
    onError: (error) => toast.error(error.message || "Даалгаврыг хадгалах боломжгүй байна."),
  });

  if (!isAuthenticated) return null;
  const completed = new Set(progressQuery.data?.completedTaskIds ?? []);
  const completedCount = tasks.filter((task) => completed.has(task.id)).length;

  return <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]" aria-labelledby="onboarding-heading">
    <div className="flex items-start justify-between gap-3">
      <div><div className="flex items-center gap-2 text-sky-700"><Sparkles size={17} /><span className="text-xs font-bold uppercase tracking-[0.13em]">Системтэй танилцах</span></div><h3 id="onboarding-heading" className="mt-2 font-bold tracking-tight">Эхний алхмууд</h3><p className="mt-1 text-xs leading-5 text-slate-600">Таны эрхэд тохирсон товч заавар. Бүх алхмыг дуусгавал “Системтэй танилцсан” урамшууллын тэмдэг автоматаар нээгдэнэ.</p></div>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sky-700">{completedCount}/{tasks.length}</span>
    </div>
    <ol className="mt-5 space-y-3">
      {tasks.map((task) => {
        const done = completed.has(task.id);
        return <li key={task.id} className="rounded-xl border border-sky-100 bg-white/90 p-3.5">
          <div className="flex gap-3"><div className={done ? "text-emerald-600" : "text-slate-300"}>{done ? <CheckCircle2 size={19} /> : <Circle size={19} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{task.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{task.description}</p><div className="mt-3 flex flex-wrap items-center gap-2"><Link href={task.href} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-950">{task.linkLabel} <ExternalLink size={12} /></Link><Button type="button" size="sm" variant="outline" className="h-7 bg-white text-xs" disabled={done || completeTask.isPending} onClick={() => completeTask.mutate({ taskId: task.id })}>{completeTask.isPending ? <Loader2 className="animate-spin" size={12} /> : null}{done ? "Дууссан" : "Дууссан гэж тэмдэглэх"}</Button></div></div></div>
        </li>;
      })}
    </ol>
  </section>;
}
