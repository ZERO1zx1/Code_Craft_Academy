/** Code Atlas Editorial: a focused, step-by-step assessment rather than a dense test form. */
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CourseModule } from "@/lib/courseData";
import { saveBeforeConfirm } from "@/lib/persistenceState";

type CourseQuizProps = {
  course: CourseModule;
  onSave: (result: { score: number; total: number; passed: boolean; answers: number[] }) => Promise<unknown>;
  isSaving?: boolean;
};

export function CourseQuiz({ course, onSave, isSaving }: CourseQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setStep(0);
    setAnswers([]);
    setSubmitted(false);
    setSaveError(null);
  }, [course.id]);

  const score = useMemo(() => answers.reduce((total, answer, index) => total + (answer === course.quiz[index]?.answer ? 1 : 0), 0), [answers, course.quiz]);
  const current = course.quiz[step];
  const selected = answers[step];
  const passed = score >= Math.ceil(course.quiz.length * 0.67);

  function choose(answer: number) {
    if (submitted) return;
    setAnswers((currentAnswers) => {
      const next = [...currentAnswers];
      next[step] = answer;
      return next;
    });
  }

  async function finish() {
    setSaveError(null);
    await saveBeforeConfirm(
      () => onSave({ score, total: course.quiz.length, passed, answers }),
      () => setSubmitted(true),
      () => setSaveError("Үр дүнг хадгалж чадсангүй. Сүлжээгээ шалгаад дахин оролдоорой."),
    );
  }

  function retry() {
    setStep(0);
    setAnswers([]);
    setSubmitted(false);
    setSaveError(null);
  }

  if (submitted) {
    return (
      <section className="quiz-card quiz-result" aria-live="polite">
        <div className={passed ? "result-medallion success" : "result-medallion retry"}>{passed ? <CheckCircle2 /> : <Sparkles />}</div>
        <p className="section-kicker">СОРИЛЫН ҮР ДҮН</p>
        <h3>{score} / {course.quiz.length}</h3>
        <p>{passed ? "Суурь ойлголтуудыг баттай барьж байна. Энэ хичээл таны ахицад хадгалагдлаа." : "Та гол санааг барьж эхэлж байна. Тайбаруудыг нэг удаа дахин уншаад, дахин оролдоорой."}</p>
        <div className="quiz-review-list">
          {course.quiz.map((question, index) => <div key={question.prompt} className={answers[index] === question.answer ? "review-row correct" : "review-row"}><span>{answers[index] === question.answer ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span><div><b>{index + 1}. {question.prompt}</b><p>{question.explanation}</p></div></div>)}
        </div>
        <Button variant="outline" className="retry-quiz-button" onClick={retry}><RotateCcw size={15} /> Дахин оролдох</Button>
      </section>
    );
  }

  return (
    <section className="quiz-card">
      <div className="quiz-topline"><div><p className="section-kicker">МЭДЛЭГ ШАЛГАХ · {course.label}</p><h3>Алхам {step + 1} <span>/ {course.quiz.length}</span></h3></div><div className="quiz-dots" aria-label={`${step + 1} дахь асуулт`}>{course.quiz.map((question, index) => <i key={question.prompt} className={index === step ? "active" : answers[index] !== undefined ? "answered" : ""} />)}</div></div>
      <p className="quiz-question">{current.prompt}</p>
      <div className="choice-stack" role="radiogroup" aria-label="Хариултын сонголтууд">
        {current.choices.map((choice, index) => <button type="button" role="radio" aria-checked={selected === index} key={choice} className={selected === index ? "quiz-choice selected" : "quiz-choice"} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span>{choice}</button>)}
      </div>
      <div className="quiz-actions">
        <Button variant="ghost" className="quiz-back" disabled={step === 0} onClick={() => setStep((currentStep) => currentStep - 1)}><ChevronLeft size={16} /> Өмнөх</Button>
        {step === course.quiz.length - 1 ? <Button className="atlas-button" disabled={answers.length !== course.quiz.length || isSaving} onClick={finish}>{isSaving ? "Хадгалж байна..." : "Үр дүнгээ харах"} <ChevronRight size={16} /></Button> : <Button className="atlas-button" disabled={selected === undefined} onClick={() => setStep((currentStep) => currentStep + 1)}>Дараах <ChevronRight size={16} /></Button>}
      </div>
      {saveError && <div className="persistence-error" role="alert"><span>{saveError}</span><button type="button" onClick={finish}>Дахин хадгалах</button></div>}
    </section>
  );
}
