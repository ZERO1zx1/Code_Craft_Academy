import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartNoAxesCombined, ClipboardList, GraduationCap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./learning-extensions.css";

export function TeacherAnalytics() {
  const overview = trpc.admin.overview.useQuery();
  if (!overview.data) return <section className="admin-section teacher-analytics"><p>Аналитикийг тооцоолж байна...</p></section>;
  const rows = overview.data.courses.map((course) => {
    const progress = overview.data.progress.filter((item) => item.courseId === course.courseId && item.state === "completed").length;
    const attempts = overview.data.attempts.filter((item) => item.courseId === course.courseId);
    const passed = attempts.filter((item) => item.passed).length;
    const assignments = overview.data.assignments.filter((item) => item.courseId === course.courseId);
    const submitted = overview.data.submissions.filter((item) => assignments.some((assignment) => assignment.id === item.assignmentId)).length;
    return { module: course.courseId.toUpperCase(), "Дууссан хичээл": progress, "Тэнцсэн сорил": passed, "Илгээлт": submitted };
  });
  const pendingGrades = overview.data.submissions.filter((item) => item.state !== "graded").length;
  return <section className="admin-section teacher-analytics"><div className="admin-section-head"><div><p className="section-kicker">СУРГАЛТЫН АНАЛИТИК</p><h2>Бодит ахиц, үнэлгээний дохио</h2></div><ChartNoAxesCombined /></div><div className="analytics-stat-row teacher-analytic-stats"><article><GraduationCap /><span>ТЭНЦСЭН СОРИЛ</span><b>{overview.data.attempts.filter((item) => item.passed).length}</b></article><article><ClipboardList /><span>ҮНЭЛГЭЭ ХҮЛЭЭЖ БУЙ</span><b>{pendingGrades}</b></article></div>{rows.length === 0 ? <p className="extension-empty">Хичээлийн аналитик үүсэхийг хүлээж байна.</p> : <div className="chart-frame"><ResponsiveContainer width="100%" height={290}><BarChart data={rows} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#D8DED9" strokeDasharray="3 3" /><XAxis dataKey="module" tick={{ fontSize: 10, fill: "#667477" }} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#667477" }} /><Tooltip cursor={{ fill: "#EEF3F0" }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Дууссан хичээл" fill="#0F766E" radius={[2, 2, 0, 0]} /><Bar dataKey="Тэнцсэн сорил" fill="#B98712" radius={[2, 2, 0, 0]} /><Bar dataKey="Илгээлт" fill="#5A6FC7" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div>}</section>;
}
