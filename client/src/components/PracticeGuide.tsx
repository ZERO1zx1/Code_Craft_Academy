import type { LanguageId } from "@/lib/curriculumData";
import { ArrowUpRight, ShieldCheck, Target } from "lucide-react";
import React from "react";
import "./free-learning.css";

type Guide = { label: string; practice: string; outcome: string; next: string };

const guides: Record<LanguageId, Guide> = {
  html: { label: "HTML PRACTICE GUIDE", practice: "Энд таны HTML нь sandboxed preview дотор л харагдана. Файл publish болохгүй, таны browser-оос өөр газар хадгалагдахгүй.", outcome: "Quest нь шаардсан element, attribute, semantic hierarchy байгаа эсэхийг DOM structure-оор шалгана.", next: "Өөрийн computer дээр `index.html` файл үүсгээд browser-оор нээж, DevTools-ийн Elements panel дээр бүтэцээ шалга." },
  css: { label: "CSS PRACTICE GUIDE", practice: "Энд таны CSS нь тусгаарлагдсан preview-д л нөлөөлнө. Энэ хичээлийн бусад page болон файл өөрчлөгдөхгүй.", outcome: "Quest нь selector, rule болон property-г CSSOM-оор parse хийж шаардлагатай layout/style байгаа эсэхийг шалгана.", next: "`style.css` файлд rule-ээ бичиж, `index.html`-ээс link хийгээд desktop ба mobile browser дээр турш." },
  javascript: { label: "JAVASCRIPT PRACTICE GUIDE", practice: "Таны код browser доторх тусгаарлагдсан Web Worker болон лабораторид ажиллана. Код сервер, account, таны компьютерийн файл руу хандахгүй.", outcome: "Quest нь console output, function result, mock DOM event эсвэл async behavior requirement-ийг хангаж буй эсэхийг автоматаар шалгана.", next: "`app.js` файл үүсгээд HTML button/input-той холбож, browser DevTools Console дээр өөрийн event ба output-оо турш." },
  python: { label: "PYTHON PRACTICE GUIDE", practice: "Таны Python код browser доторх тусгаарлагдсан Pyodide worker-д ажиллана. Энд бодит file system, terminal, account, network ашиглахгүй.", outcome: "Quest нь Python output болон assertion ашиглан variable, control flow, function эсвэл class-ийн үр дүнг шалгана.", next: "Computer дээрээ Python суулгаад `python practice.py` гэж ажиллуул. Дараагийн project-д virtual environment ашиглаж хэвшээрэй." },
  github: { label: "GITHUB PRACTICE GUIDE", practice: "Энд command simulator л ажиллана. Бодит terminal, repository, token, network ашиглахгүй бөгөөд таны GitHub account-д өөрчлөлт орохгүй.", outcome: "Quest нь command-ийн нэр, option, branch эсвэл workflow-ийн шаардлагатай бүтэц байгаа эсэхийг шалгана.", next: "Өөрийн GitHub account дээр шинэ repository үүсгээд `git status`, `git add`, `git commit`, `git push` алхмуудыг албан заавраар бодитоор давт." },
};

export function PracticeGuide({ language, source, sourceLabel }: { language: LanguageId; source: string; sourceLabel: string }) {
  const guide = guides[language];
  return <section className="practice-guide" aria-labelledby="practice-guide-heading"><div className="practice-guide-head"><div><p className="section-kicker">{guide.label}</p><h2 id="practice-guide-heading">Энд юу туршиж, дараа нь хаана үргэлжлүүлэх вэ?</h2></div><ShieldCheck size={23} /></div><div className="practice-guide-grid"><article><span><ShieldCheck size={16} /> ЭНД ТУРШИХ</span><p>{guide.practice}</p></article><article><span><Target size={16} /> АВТОМАТ ШАЛГАЛТ</span><p>{guide.outcome}</p></article><article><span><ArrowUpRight size={16} /> ДАРААГИЙН БОДИТ АЛХАМ</span><p>{guide.next}</p></article></div><a className="practice-source-link" href={source} target="_blank" rel="noreferrer">{sourceLabel}-ийг нээж өөрийн project дээр үргэлжлүүлэх <ArrowUpRight size={15} /></a></section>;
}
