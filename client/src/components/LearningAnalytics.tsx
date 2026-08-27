import { BarChart3, BookOpenCheck, ClipboardCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import "./learning-extensions.css";

export function LearningAnalytics() {
  const analytics = trpc.learning.analytics.useQuery();
  if (analytics.isLoading) return <section className="analytics-panel"><p>Ахицын статистикийг тооцоолж байна...</p></section>;
  if (analytics.error) return <section className="analytics-panel"><p>Ахицын статистикийг ачаалж чадсангүй.</p><button type="button" onClick={() => analytics.refetch()}>Дахин ачаалах</button></section>;
  const data = analytics.data;
  const chartData = (data?.courses ?? []).map((course) => {
    const attempts = data?.attempts.filter((item) => item.courseId === course.courseId) ?? [];
    const bestQuiz = attempts.length ? Math.max(...attempts.map((item) => Math.round((item.score / item.total) * 100))) : 0;
    const assignment = data?.assignments.find((item) => item.courseId === course.courseId)?.submission;
    const assignmentScore = assignment?.state === "graded" && assignment.score !== null ? Math.round((assignment.score / (data?.assignments.find((item) => item.courseId === course.courseId)?.maxScore ?? 1)) * 100) : 0;
    const completed = data?.progress.some((item) => item.courseId === course.courseId && item.state === "completed") ? 100 : 0;
    return { module: course.courseId.toUpperCase(), "Хичээл": completed, "Сорил": bestQuiz, "Даалгавар": assignmentScore };
  });
  const completedCount = chartData.filter((item) => item["Хичээл"] === 100).length;
  const gradedCount = (data?.assignments ?? []).filter((item) => item.submission?.state === "graded").length;
  return <section className="analytics-panel"><div className="extension-head"><div><p className="section-kicker">ТАНЫ АХИЦЫН ДҮР ЗУРАГ</p><h3>Хийсэн ажлаа тоогоор хар.</h3></div><BarChart3 /></div><div className="analytics-stat-row"><article><BookOpenCheck /><span>ДУУССАН МОДУЛЬ</span><b>{completedCount} / {chartData.length}</b></article><article><ClipboardCheck /><span>ҮНЭЛГЭЭТЭЙ ДААЛГАВАР</span><b>{gradedCount}</b></article></div>{chartData.length === 0 ? <p className="extension-empty">Статистик үүсгэхийн тулд хичээл, сорил, даалгавраа үргэлжлүүлээрэй.</p> : <div className="chart-frame"><ResponsiveContainer width="100%" height={255}><BarChart data={chartData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#D8DED9" strokeDasharray="3 3" /><XAxis dataKey="module" tick={{ fontSize: 10, fill: "#667477" }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#667477" }} /><Tooltip cursor={{ fill: "#EEF3F0" }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Хичээл" fill="#0F766E" radius={[2, 2, 0, 0]} /><Bar dataKey="Сорил" fill="#B98712" radius={[2, 2, 0, 0]} /><Bar dataKey="Даалгавар" fill="#5A6FC7" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div>}</section>;
}
