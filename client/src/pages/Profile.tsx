import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Check, Copy, Download, ExternalLink, PencilLine, Save, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLearningPathStatus } from "@shared/curriculum";
import { startLogin } from "@/const";
import { RoleGuideCard } from "@/components/RoleGuideCard";
import { createOnboardingAchievementSvg, downloadOnboardingAchievementImage, shareOnboardingAchievementImage } from "@/lib/onboardingAchievementImage";
import { buildCertificateProfileUrl, createCertificateProfileQrDataUrl } from "@/lib/certificateProfileQr";

export default function Profile() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const pathUserId = Number(window.location.pathname.split("/")[2]);
  const profileId = Number.isInteger(pathUserId) && pathUserId > 0 ? pathUserId : user?.id;
  const profileQuery = trpc.profile.public.useQuery({ userId: profileId ?? 0 }, { enabled: Boolean(profileId) });
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [achievementShareStatus, setAchievementShareStatus] = useState<"idle" | "shared" | "downloaded" | "error">("idle");
  const [certificateQrDataUrl, setCertificateQrDataUrl] = useState<string | null>(null);
  const progress = useMemo(() => Object.fromEntries((profileQuery.data?.progress ?? []).map((row) => [row.courseId, row.progressPercent])), [profileQuery.data]);
  const stages = getLearningPathStatus(progress);
  const total = stages.length ? Math.round(stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length) : 0;
  const displayName = profileQuery.data?.displayName ?? profileQuery.data?.name ?? user?.displayName ?? user?.name ?? "CodeCraft суралцагч";
  const onboardingBadge = profileQuery.data?.badges?.find((item) => item.badge.slug === "onboarding-complete");
  const onboardingImageInput = onboardingBadge ? { displayName, awardedAt: onboardingBadge.awardedAt } : null;
  const onboardingImageUrl = useMemo(() => onboardingImageInput ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createOnboardingAchievementSvg(onboardingImageInput))}` : null, [onboardingImageInput?.awardedAt, onboardingImageInput?.displayName]);
  const isOwnProfile = isAuthenticated && profileId === user?.id;

  useEffect(() => {
    let active = true;
    if (!profileQuery.data?.certificate || !profileId) {
      setCertificateQrDataUrl(null);
      return () => { active = false; };
    }
    void createCertificateProfileQrDataUrl(buildCertificateProfileUrl(window.location.origin, profileId))
      .then((dataUrl) => { if (active) setCertificateQrDataUrl(dataUrl); })
      .catch(() => { if (active) setCertificateQrDataUrl(null); });
    return () => { active = false; };
  }, [profileId, profileQuery.data?.certificate?.verificationCode]);
  const updateDisplayName = trpc.profile.updateDisplayName.useMutation({
    onSuccess: async () => {
      setEditingName(false);
      await Promise.all([utils.auth.me.invalidate(), utils.profile.public.invalidate({ userId: profileId ?? 0 })]);
    },
  });

  useEffect(() => {
    if (!editingName) setDraftName(displayName);
  }, [displayName, editingName]);

  const share = () => {
    if (!profileId) return;
    navigator.clipboard?.writeText(`${window.location.origin}/profile/${profileId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareAchievement = async () => {
    if (!onboardingImageInput) return;
    try {
      const result = await shareOnboardingAchievementImage(onboardingImageInput);
      setAchievementShareStatus(result);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAchievementShareStatus("error");
    }
  };

  if (authLoading || profileQuery.isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500">Профайлыг ачаалж байна...</div>;
  if (!isAuthenticated && !profileId) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold">Профайлаа нээхийн тулд нэвтэрнэ үү</h1><p className="mt-3 text-sm leading-6 text-slate-500">Таны ахиц, амжилтын тэмдэг, сертификат зөвхөн таны бүртгэлтэй холбогдож хадгалагдана.</p><Button onClick={() => startLogin()} className="mt-6 rounded-xl bg-slate-950">Нэвтрэх</Button></div></div>;
  if (!profileQuery.data) return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] p-6"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold">Профайл олдсонгүй</h1><Link href="/" className="mt-5 inline-block text-sm font-semibold text-violet-600">Нүүр хуудас руу буцах</Link></div></div>;

  const badges = profileQuery.data.badges ?? [];
  const certificate = profileQuery.data.certificate;
  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <header className="border-b border-slate-200/80 bg-white"><div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 lg:px-10"><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={17} /> Нүүр хуудас</Link><Button onClick={share} variant="outline" className="h-9 rounded-lg text-xs">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Хуулсан" : "Профайл хуваалцах"}</Button></div></header>
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_280px]"><div className="cc-lab-grid relative overflow-hidden rounded-3xl bg-[#17152c] p-7 text-white shadow-[0_24px_60px_rgba(27,18,71,0.2)] lg:p-10"><div className="relative flex flex-wrap items-start justify-between gap-6"><div><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-300 text-2xl font-black text-violet-950 shadow-lg shadow-violet-950/35">{displayName.slice(0, 1).toUpperCase()}</div><p className="cc-mono-label mt-6 text-[10px] text-violet-300">Learner identity · нийтэд нээлттэй</p><h1 className="cc-display mt-2 text-4xl font-bold tracking-[-0.05em]">{displayName}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/60">Энд таны хадгалагдсан ахиц болон олгогдсон амжилтын тэмдгүүд харагдана.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-right backdrop-blur-sm"><p className="cc-mono-label text-[9px] text-white/50">Нийт ахиц</p><p className="mt-1 text-4xl font-bold">{total}%</p><p className="mt-1 text-xs text-white/45">Хадгалагдсан сургалтын ахиц</p></div></div><div className="relative mt-9 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.7)]" style={{ width: `${total}%` }} /></div><div className="relative mt-3 flex items-center justify-between text-xs text-white/45"><span>CodeCraft Academy</span><span>Суралцагчийн дугаар: {profileId}</span></div></div><div className="cc-surface rounded-3xl p-6"><div className="flex items-center gap-2 text-violet-600"><Award size={18} /><span className="cc-mono-label text-[10px]">Сертификат</span></div><h2 className="cc-display mt-5 text-xl font-bold">Вэбийн суурь мэдлэг</h2>{certificate ? <><p className="mt-2 text-sm leading-6 text-slate-500">Энэ сертификат бодит ахицын шалгуур хангасны дараа олгогдсон.</p><div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><ShieldCheck size={15} className="mr-1 inline" />Баталгаажсан: {certificate.verificationCode}</div>{certificateQrDataUrl ? <div data-testid="certificate-profile-qr" className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3"><img src={certificateQrDataUrl} alt={`${displayName}-ийн public profile QR код`} className="h-20 w-20 rounded-lg bg-white p-1 shadow-sm" /><div><p className="text-xs font-bold text-violet-950">Профайл руу очих QR</p><p className="mt-1 text-[11px] leading-4 text-violet-700">Скан хийж, энэ суралцагчийн нийтэд нээлттэй профайлыг хараарай.</p></div></div> : null}<Button className="mt-6 w-full rounded-xl bg-slate-950 text-xs hover:bg-violet-600">Сертификатаа харах <ExternalLink size={14} /></Button></> : <><p className="mt-2 text-sm leading-6 text-slate-500">Python, HTML, CSS, JavaScript-ийн нийт ахиц 90%-д хүрэхэд сертификат үүснэ.</p><div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-600"><ShieldCheck size={15} /> {Math.max(0, 90 - total)}% үлдсэн</div><Button disabled className="mt-6 w-full rounded-xl text-xs">Одоогоор сертификат олгогдоогүй</Button></>}</div></section>
        {isOwnProfile ? <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]"><div className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">Профайлын тохиргоо</p><h2 className="mt-2 text-xl font-bold">Дэлгэцэнд харагдах нэр</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Энэ нэр таны профайл, нүүр хуудас болон нийтэд хуваалцсан суралцагчийн профайлд харагдана. Таны нэвтрэх бүртгэл өөрчлөгдөхгүй.</p></div>{!editingName ? <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditingName(true)}><PencilLine size={15} /> Нэрээ өөрчлөх</Button> : null}</div>{editingName ? <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); updateDisplayName.mutate({ displayName: draftName }); }}><Input aria-label="Дэлгэцийн нэр" value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={80} className="h-11 rounded-xl" autoFocus /><div className="flex gap-2"><Button type="submit" className="h-11 rounded-xl bg-slate-950" disabled={updateDisplayName.isPending}><Save size={15} /> {updateDisplayName.isPending ? "Хадгалж байна..." : "Хадгалах"}</Button><Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setEditingName(false)} disabled={updateDisplayName.isPending}>Болих</Button></div></form> : <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Одоогийн харагдах нэр: {displayName}</p>}{updateDisplayName.error ? <p className="mt-3 text-sm font-medium text-rose-600" role="alert">{updateDisplayName.error.message}</p> : null}</div><RoleGuideCard role={user?.role} compact /></section> : null}
        <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Амжилтын тэмдэг</p><h2 className="mt-2 text-2xl font-bold">Олгогдсон амжилтын тэмдгүүд</h2></div><span className="text-xs text-slate-400">{badges.length} олгогдсон</span></div>{onboardingBadge && onboardingImageInput && onboardingImageUrl ? <div data-testid="onboarding-achievement-share-card" className="mt-5 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm"><div className="grid gap-0 lg:grid-cols-[1.25fr_1fr]"><img src={onboardingImageUrl} alt={`${displayName}-ийн Системтэй танилцсан амжилтын зураг`} className="h-auto w-full bg-[#17152c]" /><div className="flex flex-col justify-center p-6 lg:p-8"><p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">Хуваалцах амжилт</p><h3 className="mt-2 text-xl font-bold">Onboarding амжилтаа хуваалцаарай</h3><p className="mt-3 text-sm leading-6 text-slate-500">Энэ зураг нь таны бодитоор олгогдсон “Системтэй танилцсан” badge болон нэрээр автоматаар үүснэ.</p><div className="mt-6 flex flex-wrap gap-2"><Button type="button" className="rounded-xl bg-slate-950" onClick={shareAchievement}><Share2 size={15} /> {achievementShareStatus === "shared" ? "Хуваалцсан" : "Зураг хуваалцах"}</Button><Button type="button" variant="outline" className="rounded-xl" onClick={() => downloadOnboardingAchievementImage(onboardingImageInput)}><Download size={15} /> Зураг татах</Button></div>{achievementShareStatus === "downloaded" ? <p className="mt-4 text-xs font-medium text-emerald-700">Энэ браузерт шууд share дэмжихгүй тул зураг татагдлаа.</p> : null}{achievementShareStatus === "error" ? <p className="mt-4 text-xs font-medium text-rose-600" role="alert">Зургийг хуваалцах үед алдаа гарлаа. “Зураг татах” товчийг ашиглана уу.</p> : null}</div></div></div> : null}{badges.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{badges.map(({ badge, awardedAt }) => <div key={badge.slug} className="rounded-2xl border border-emerald-200 bg-white p-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 font-mono text-sm font-bold text-emerald-700"><Sparkles size={18} /></div><h3 className="mt-5 text-sm font-bold">{badge.title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{badge.description}</p><div className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">Олгосон · {new Date(awardedAt).toLocaleDateString()}</div></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="text-sm font-semibold">Одоогоор амжилтын тэмдэг олгогдоогүй байна.</p><p className="mt-2 text-xs text-slate-400">Ахиц хадгалагдахад систем шалгуурыг автоматаар үнэлнэ.</p></div>}</section>
      </main>
    </div>
  );
}
