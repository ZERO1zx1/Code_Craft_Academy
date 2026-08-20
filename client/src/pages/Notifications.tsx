import { useState } from "react";
import { Bell, BookOpen, CheckCheck, ChevronRight, ClipboardCheck, Loader2, Mail, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const iconByType = { lesson: BookOpen, quiz: ClipboardCheck, project: CheckCheck };

function toUint8Array(value: string) {
  const base64 = `${value.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const preferencesQuery = trpc.notifications.preferences.useQuery(undefined, { enabled: isAuthenticated });
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const pushConfigQuery = trpc.notifications.pushConfig.useQuery(undefined, { enabled: isAuthenticated });
  const [pushBusy, setPushBusy] = useState(false);
  const updatePreferences = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => { utils.notifications.preferences.invalidate(); toast.success("Мэдэгдлийн тохиргоо хадгалагдлаа."); },
    onError: (error) => toast.error(error.message || "Тохиргоо хадгалах боломжгүй байлаа."),
  });
  const savePushSubscription = trpc.notifications.savePushSubscription.useMutation();
  const clearPushSubscription = trpc.notifications.clearPushSubscription.useMutation();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const preferences = preferencesQuery.data;
  const saveSettings = (next: Partial<{ lessonUpdatesEnabled: boolean; quizResultsEnabled: boolean; projectFeedbackEnabled: boolean; emailEnabled: boolean; browserPushEnabled: boolean }>) => {
    if (!preferences) return;
    updatePreferences.mutate({
      lessonUpdatesEnabled: preferences.lessonUpdatesEnabled === 1,
      quizResultsEnabled: preferences.quizResultsEnabled === 1,
      projectFeedbackEnabled: preferences.projectFeedbackEnabled === 1,
      emailEnabled: preferences.emailEnabled === 1,
      browserPushEnabled: preferences.browserPushEnabled === 1,
      ...next,
    });
  };

  const updateBrowserPush = async (enabled: boolean) => {
    if (!preferences) return;
    if (!enabled) {
      setPushBusy(true);
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        await registration?.pushManager.getSubscription().then((subscription) => subscription?.unsubscribe());
        await clearPushSubscription.mutateAsync();
        saveSettings({ browserPushEnabled: false });
      } catch {
        toast.error("Хөтчийн шууд мэдэгдлийн тохиргоог цуцлах боломжгүй байлаа.");
      } finally { setPushBusy(false); }
      return;
    }

    const publicKey = pushConfigQuery.data?.publicKey;
    if (!publicKey) {
      toast.error("Хөтчийн шууд мэдэгдэл одоогоор серверийн тохиргоог хүлээж байна.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Таны ашиглаж буй хөтөч шууд мэдэгдлийг дэмжихгүй байна.");
      return;
    }

    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Мэдэгдлийн зөвшөөрөл өгөөгүй тул идэвхжүүлсэнгүй.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(publicKey) });
      const serialized = subscription.toJSON();
      const p256dh = serialized.keys?.p256dh;
      const auth = serialized.keys?.auth;
      if (!serialized.endpoint || !p256dh || !auth) throw new Error("Шууд мэдэгдлийн бүртгэлийн мэдээлэл дутуу байна.");
      await savePushSubscription.mutateAsync({ endpoint: serialized.endpoint, p256dh, auth });
      saveSettings({ browserPushEnabled: true });
      toast.success("Хөтчийн шууд мэдэгдэл идэвхжлээ.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Хөтчийн шууд мэдэгдлийг идэвхжүүлэх боломжгүй байлаа.");
    } finally { setPushBusy(false); }
  };

  if (!isAuthenticated || !user) return <main className="min-h-screen bg-slate-50 p-6"><section className="mx-auto mt-20 max-w-lg rounded-2xl border bg-white p-8 text-center"><Bell className="mx-auto text-violet-600" size={28} /><h1 className="mt-4 text-2xl font-bold">Мэдэгдлээ хянахын тулд нэвтэрнэ үү.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Шинэ хичээл, шалгалтын үр дүн, багшийн төслийн санал хүсэлтийг таны бүртгэл дээр хадгалж харуулна.</p><Button onClick={() => startLogin()} className="mt-6 bg-slate-950 hover:bg-violet-700">Нэвтрэх</Button></section></main>;

  const inAppSettings = [
    { key: "lessonUpdatesEnabled" as const, title: "Шинэ хичээлийн мэдээ", detail: "Багш шинэ хичээлийн мэдээ нийтлэхэд мэдэгдэл хүлээн авах." },
    { key: "quizResultsEnabled" as const, title: "Шалгалтын үр дүн", detail: "Шалгалт илгээсний дараах оноо, зөв хариултын товч мэдээлэл авах." },
    { key: "projectFeedbackEnabled" as const, title: "Төслийн үнэлгээ", detail: "Багш үнэлгээ болон санал хүсэлт оруулахад мэдэгдэл авах." },
  ];

  return <main className="min-h-screen bg-[#f7f8fb] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-5 lg:px-8"><Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Нүүр хуудас</Link><Link href="/curriculum" className="text-sm font-semibold text-violet-700">Хичээлүүд</Link></div></header><div className="mx-auto grid max-w-5xl gap-7 px-5 py-9 lg:grid-cols-[360px_1fr] lg:px-8"><aside><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Суралцагчийн тохиргоо</p><h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]">Мэдэгдэл</h1><p className="mt-4 text-sm leading-7 text-slate-500">Тохиргоогоо зөвшөөрч, сургалтын мэдээгээ дотоод мэдэгдлийн хайрцаг, и-мэйл, эсвэл хөтчийн шууд мэдэгдлээр хүлээн авна.</p><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><h2 className="font-bold">Ямар мэдээ авах вэ?</h2>{preferencesQuery.isLoading ? <Loader2 className="mt-5 animate-spin text-violet-600" /> : <div className="mt-4 divide-y divide-slate-100">{inAppSettings.map((setting) => <div key={setting.key} className="flex items-start justify-between gap-4 py-4"><div><p className="text-sm font-semibold">{setting.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{setting.detail}</p></div><Switch checked={Boolean(preferences?.[setting.key])} onCheckedChange={(value) => saveSettings({ [setting.key]: value })} disabled={!preferences || updatePreferences.isPending} aria-label={setting.title} /></div>)}</div>}</section><section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-2 text-violet-800"><Mail size={18} /><h2 className="font-bold">И-мэйл мэдэгдэл</h2></div><p className="mt-2 text-xs leading-5 text-slate-600">Зөвшөөрвөл дээрх төрлийн шинэ мэдээг таны бүртгэлтэй и-мэйл хаяг руу илгээнэ.</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold">И-мэйлээр мэдэгдэх</span><Switch checked={preferences?.emailEnabled === 1} onCheckedChange={(value) => saveSettings({ emailEnabled: value })} disabled={!preferences || updatePreferences.isPending} aria-label="И-мэйлээр мэдэгдэх" /></div></section><section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5"><div className="flex items-center gap-2 text-sky-800"><MonitorSmartphone size={18} /><h2 className="font-bold">Хөтчийн шууд мэдэгдэл</h2></div><p className="mt-2 text-xs leading-5 text-slate-600">Хөтөч хаалттай байсан ч гарч болох мэдэгдэл. Та хөтчийн зөвшөөрлийг хүссэн үедээ цуцалж болно.</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold">Шууд мэдэгдэл</span><Switch checked={preferences?.browserPushEnabled === 1} onCheckedChange={updateBrowserPush} disabled={!preferences || pushBusy || updatePreferences.isPending} aria-label="Хөтчийн шууд мэдэгдэл" /></div>{!pushConfigQuery.data?.publicKey ? <p className="mt-3 rounded-lg bg-white/70 p-2 text-[11px] leading-4 text-sky-800">Серверийн шаардлагатай түлхүүр хараахан оруулаагүй тул энэ сонголт идэвхжихэд бэлэн боловч одоогоор хөтөч зөвшөөрөл асуухгүй.</p> : null}</section><div className="mt-5 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={16} />Таны тохиргоо зөвхөн сургалтын мэдээнд хэрэглэгдэнэ. И-мэйл болон шууд мэдэгдлийг дуртай үедээ унтрааж болно.</div></aside><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Таны мэдэгдлүүд</h2><p className="mt-1 text-sm text-slate-500">Шинэ нь тод харагдаж, нээхэд уншсан төлөвт шилжинэ.</p></div><Bell className="text-violet-600" size={20} /></div>{notificationsQuery.isLoading ? <div className="mt-8 flex justify-center"><Loader2 className="animate-spin text-violet-600" /></div> : notificationsQuery.data?.length ? <div className="mt-6 divide-y divide-slate-100">{notificationsQuery.data.map((notification) => { const Icon = iconByType[notification.type]; const content = <><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.readAt ? "bg-slate-100 text-slate-500" : "bg-violet-100 text-violet-600"}`}><Icon size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{notification.title}</p>{!notification.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" aria-label="Шинэ" /> : null}</div><p className="mt-1 text-sm leading-6 text-slate-500">{notification.content}</p><p className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></div>{notification.href ? <ChevronRight className="mt-3 shrink-0 text-slate-400" size={17} /> : null}</>; return notification.href ? <a key={notification.id} href={notification.href} onClick={() => { if (!notification.readAt) markRead.mutate({ notificationId: notification.id }); }} className="flex gap-4 py-5 transition hover:bg-slate-50/70">{content}</a> : <button key={notification.id} type="button" onClick={() => { if (!notification.readAt) markRead.mutate({ notificationId: notification.id }); }} className="flex w-full gap-4 py-5 text-left transition hover:bg-slate-50/70">{content}</button>; })}</div> : <div className="mt-8 rounded-xl border border-dashed border-slate-200 p-8 text-center"><Bell className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold">Одоогоор шинэ мэдэгдэл алга.</p><p className="mt-1 text-xs leading-5 text-slate-400">Шалгалт илгээх, төслөө үнэлүүлэх эсвэл багш шинэ хичээлийн мэдээ нийтлэхэд энд орж ирнэ.</p></div>}</section></div></main>;
}
