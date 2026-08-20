import { BookOpenCheck, ClipboardCheck, Crown, GraduationCap, ShieldCheck } from "lucide-react";

type Role = "user" | "reviewer" | "teacher" | "admin" | "owner" | null | undefined;

const roleGuide = {
  user: {
    title: "Суралцагч",
    summary: "Хичээлээ үргэлжлүүлж, шалгалт болон төслөөр ур чадвараа ахиулна.",
    detail: "Та сургалтын замналаа хянах, AI туслахаас чиглэл авах, төслөө хувилбараар илгээх, амжилтын тэмдэг ба сертификатын шалгуураа харах боломжтой.",
    actions: ["Хичээлээ үргэлжлүүлэх", "Шалгалт өгөх", "Төсөл илгээх", "Профайлаа шинэчлэх"],
    boundary: "Та бусад суралцагчийн мэдээлэл, үнэлгээний тохиргоо болон багийн эрхийг өөрчлөх боломжгүй.",
    icon: GraduationCap,
    tone: "bg-violet-50 text-violet-700 border-violet-100",
  },
  reviewer: {
    title: "Шалгагч",
    summary: "Суралцагчийн төслийг шалгаж, оноо болон засварын санал өгнө.",
    detail: "Та төслийн хувилбар, хавсралт болон үнэлгээний шалгуурыг харж, зөвхөн үнэлгээтэй холбоотой үйлдлүүдийг гүйцэтгэнэ.",
    actions: ["Төсөл шалгах", "Оноо өгөх", "Санал бичих", "Хавсралт харах"],
    boundary: "Та хичээл нийтлэх, rubric-ийн загвар үүсгэх, хэрэглэгчийн дүр өөрчлөх эрхгүй.",
    icon: ClipboardCheck,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  teacher: {
    title: "Багш",
    summary: "Хичээл, үнэлгээний шалгуур болон суралцагчийн ахицыг удирдана.",
    detail: "Та сургалтын явцыг хянах, хичээлийн мэдэгдэл түгээх, үнэлгээний шалгуур үүсгэх, тайлан татах боломжтой.",
    actions: ["Ахиц хянах", "Хичээл нийтлэх", "Rubric үүсгэх", "Дүнгийн тайлан татах"],
    boundary: "Та хэрэглэгчийн дүр удирдах болон rubric JSON импорт, экспорт хийх owner-only эрхгүй.",
    icon: BookOpenCheck,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
  },
  admin: {
    title: "Системийн админ",
    summary: "Багийн хэрэглэгчийн эрх болон сургалтын ажиллагааг зохицуулна.",
    detail: "Та эрхийн тохиргоо болон үйл ажиллагааны мэдээллийг хянах боломжтой. Эзэмшигчийн онцгой тохиргоо танд хамаарахгүй.",
    actions: ["Ахиц хянах", "Хичээл нийтлэх", "Үнэлгээ хийх", "Мэдэгдлийн тайлан харах"],
    boundary: "Эзэмшигчийн түвшний багийн эрх, rubric JSON солилцоо танд нээлттэй биш.",
    icon: ShieldCheck,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
  owner: {
    title: "Платформын эзэмшигч",
    summary: "CodeCraft Academy-ийн эрх, үнэлгээний загвар болон үйл ажиллагааг бүрэн удирдана.",
    detail: "Та багийн эрхийг удирдах, үнэлгээний шалгуурыг импортлох, экспортлох, идэвхжүүлэх болон сургалтын үйл ажиллагааны тайланг бүхэлд нь хянах боломжтой.",
    actions: ["Багийн эрх удирдах", "Хичээл нийтлэх", "Rubric импорт/экспорт", "Бүх тайлан хянах"],
    boundary: "Энэ эрх нь зөвхөн таны нэвтэрсэн CodeCraft бүртгэлд үйлчилнэ. Өөр бүртгэлээр нэвтэрсэн бол owner цэс харагдахгүй.",
    icon: Crown,
    tone: "bg-rose-50 text-rose-700 border-rose-100",
  },
} as const;

export function getRoleGuide(role: Role) {
  return roleGuide[role ?? "user"] ?? roleGuide.user;
}

export function RoleGuideCard({ role, compact = false, className = "" }: { role: Role; compact?: boolean; className?: string }) {
  const guide = getRoleGuide(role);
  const Icon = guide.icon;
  return (
    <section className={`rounded-2xl border p-5 ${guide.tone} ${className}`} aria-label={`${guide.title} эрхийн мэдээлэл`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70"><Icon size={19} /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em]">Таны эрх</p>
          <h2 className="mt-1 font-bold">{guide.title}</h2>
          <p className="mt-1 text-sm leading-5 opacity-80">{guide.summary}</p>
          {!compact ? <div className="mt-3 space-y-3"><p className="text-xs leading-5 opacity-75">{guide.detail}</p><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">Таны хийж болох үйлдлүүд</p><div className="mt-2 flex flex-wrap gap-1.5">{guide.actions.map((action) => <span key={action} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold">{action}</span>)}</div></div><p className="rounded-lg bg-white/45 px-3 py-2 text-xs leading-5 opacity-80"><b>Эрхийн хязгаар:</b> {guide.boundary}</p></div> : null}
        </div>
      </div>
    </section>
  );
}
