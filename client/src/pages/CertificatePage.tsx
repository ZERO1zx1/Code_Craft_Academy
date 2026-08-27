import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Award, Download, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CertificatePage() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const status = trpc.certificates.status.useQuery(undefined, { enabled: Boolean(user) });
  const issue = trpc.certificates.issue.useMutation({ onSuccess: () => utils.certificates.status.invalidate() });
  useEffect(() => { if (status.data?.eligible && !status.data.certificate && !issue.isPending) issue.mutate(); }, [issue, status.data?.certificate, status.data?.eligible]);
  if (loading || status.isLoading) return <div className="hub-loading">Сертификатыг бэлтгэж байна...</div>;
  if (!status.data?.certificate) return <main className="certificate-gate"><Award /><h1>Сертификат хараахан бэлэн биш байна.</h1><p>Бүх хичээлээ дуусгаж, модуль бүрийн сорилыг амжилттай өгөөрэй.</p><Button className="atlas-button" onClick={() => setLocation("/learn")}>Сургалт руу буцах</Button></main>;
  const certificate = status.data.certificate;
  return <main className="certificate-page"><header className="certificate-page-header no-print"><Button variant="ghost" onClick={() => setLocation("/learn")}><ArrowLeft size={16} /> Сургалт руу буцах</Button><Button className="atlas-button" onClick={() => window.print()}><Download size={16} /> PDF болгон татах</Button></header><section className="certificate-sheet"><div className="certificate-topline"><span>CODECRAFT ACADEMY</span><ShieldCheck size={20} /></div><Award className="certificate-award" /><p className="section-kicker">АМЖИЛТТАЙ ДУУСГАСНЫ ГЭРЧИЛГЭЭ</p><h1>Certificate of Completion</h1><p className="certificate-presented">Энэхүү гэрчилгээг</p><h2>{user?.name || "CodeCraft суралцагч"}</h2><p className="certificate-copy">HTML, CSS, JavaScript, Python сургалтын замын хичээл, кодын дадал болон мэдлэгийн сорилын шалгуурыг ханган амжилттай дуусгасныг баталгаажуулж олгов.</p><div className="certificate-meta"><div><small>ОЛГОСОН ОГНОО</small><b>{new Date(certificate.issuedAt).toLocaleDateString()}</b></div><div><small>CREDENTIAL ID</small><b>{certificate.credentialId}</b></div><div><small>БАТАЛГАА</small><b>CodeCraft Academy</b></div></div></section><p className="certificate-note no-print">“PDF болгон татах” товч нь browser-ийн print цонхоор сертификатыг PDF хэлбэрээр хадгалах боломж нээнэ.</p></main>;
}
