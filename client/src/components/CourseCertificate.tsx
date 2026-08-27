import { Award, ChevronRight, Download, LockKeyhole } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function CourseCertificate() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const status = trpc.certificates.status.useQuery();
  const issue = trpc.certificates.issue.useMutation({ onSuccess: () => utils.certificates.status.invalidate() });
  const certificate = status.data?.certificate;

  useEffect(() => {
    if (status.data?.eligible && !certificate && !issue.isPending) issue.mutate();
  }, [certificate, issue, status.data?.eligible]);

  if (status.isLoading) return <section className="certificate-card certificate-loading">Сертификатын шалгуурыг тооцоолж байна...</section>;
  if (certificate) return <section className="certificate-card certificate-ready"><Award /><div><p className="section-kicker">СЕРТИФИКАТ БЭЛЭН</p><h3>CodeCraft Academy төгсөлтийн гэрчилгээ</h3><p>Таны хичээл, сорилын шалгуур баталгаажлаа. Credential: <b>{certificate.credentialId}</b></p></div><Button className="atlas-button" onClick={() => setLocation("/certificate")}><Download size={16} /> PDF татах</Button></section>;

  const incomplete = (status.data?.missingCompletionIds.length ?? 0) + (status.data?.missingQuizIds.length ?? 0);
  return <section className="certificate-card certificate-locked"><LockKeyhole /><div><p className="section-kicker">ТӨГСӨЛТИЙН ШАЛГУУР</p><h3>Сертификат руу алхам алхмаар.</h3><p>Бүх модулийн хичээлийг дуусгаж, сорил бүрийн босгыг хангахад сертификат автоматаар үүснэ. Үлдсэн шалгуур: <b>{incomplete}</b></p>{issue.error && <p className="certificate-error">Сертификатыг үүсгэж чадсангүй. <button type="button" onClick={() => issue.mutate()}>Дахин оролдох</button></p>}</div><ChevronRight /></section>;
}
