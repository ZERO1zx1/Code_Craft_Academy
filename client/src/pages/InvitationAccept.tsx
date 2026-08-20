import { useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const pendingInvitationStorageKey = "codecraft-pending-invitation";

export default function InvitationAccept() {
  const { user, isAuthenticated, loading } = useAuth();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token")?.trim() ?? "", []);
  const [acceptedRole, setAcceptedRole] = useState<string | null>(null);
  const acceptInvitation = trpc.owner.invitations.accept.useMutation({
    onSuccess: (result) => {
      window.sessionStorage.removeItem(pendingInvitationStorageKey);
      setAcceptedRole(result.role);
      toast.success("Ажилтны урилга амжилттай зөвшөөрөгдлөө.");
    },
    onError: (error) => toast.error(error.message || "Урилгыг зөвшөөрөх боломжгүй байна."),
  });

  const beginLogin = () => {
    window.sessionStorage.setItem(pendingInvitationStorageKey, token);
    startLogin();
  };

  const validToken = token.length >= 20;
  return <main className="min-h-screen bg-[#f7f8fb] px-5 py-12 text-slate-950"><section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
    {acceptedRole ? <><CheckCircle2 className="text-emerald-600" size={34}/><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Урилга зөвшөөрөгдлөө</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Таны {acceptedRole === "teacher" ? "багшийн" : acceptedRole === "reviewer" ? "шалгагчийн" : "эзэмшигчийн"} эрх идэвхжлээ.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Одоо та өөрийн эрхэд тохирсон удирдлагын самбар руу орж, танилцах жагсаалтаа үргэлжлүүлж болно.</p><Link href="/teacher" className="mt-6 inline-flex h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-violet-700">Удирдлагын самбар руу</Link></> : !validToken ? <><ShieldAlert className="text-rose-600" size={34}/><h1 className="mt-5 text-2xl font-bold tracking-tight">Урилгын холбоос буруу байна.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Багийн эзэмшигчээс дахин, бүтэн холбоос авч оролдоно уу.</p><Link href="/" className="mt-6 inline-flex text-sm font-bold text-violet-700">Нүүр хуудас руу буцах</Link></> : <><KeyRound className="text-violet-700" size={34}/><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">CodeCraft Academy</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Ажилтны урилгыг зөвшөөрөх</h1><p className="mt-3 text-sm leading-6 text-slate-500">Энэ холбоос нь нэг удаа ашиглагдах бөгөөд таны нэвтэрсэн и-мэйл урилгад заасан хаягтай таарах ёстой.</p>{loading ? <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/> Нэвтрэлтийг шалгаж байна…</div> : !isAuthenticated ? <Button type="button" onClick={beginLogin} className="mt-6 bg-slate-950 hover:bg-violet-700">Нэвтэрч үргэлжлүүлэх</Button> : <><div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm"><p className="font-bold">Нэвтэрсэн хэрэглэгч</p><p className="mt-1 text-slate-500">{user?.email ?? "И-мэйл тодорхойгүй"}</p></div><Button type="button" onClick={() => acceptInvitation.mutate({ token })} disabled={acceptInvitation.isPending} className="mt-5 bg-slate-950 hover:bg-violet-700">{acceptInvitation.isPending ? <Loader2 className="animate-spin"/> : null}Урилгыг зөвшөөрөх</Button></>}</>}
  </section></main>;
}
