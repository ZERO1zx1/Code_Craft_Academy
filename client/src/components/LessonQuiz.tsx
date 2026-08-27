import type { LessonQuizQuestion } from "@/lib/curriculumQuiz";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, RotateCcw } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import "./lesson-quiz.css";

export function LessonQuiz({ questions }: { questions: LessonQuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => Array.from({ length: questions.length }, () => null));
  const [isComplete, setComplete] = useState(false);
  const question = questions[index];
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const score = useMemo(() => questions.reduce((total, item, itemIndex) => total + (answers[itemIndex] === item.answer ? 1 : 0), 0), [answers, questions]);
  const choose = (choice: number) => { if (!isComplete) setAnswers((current) => current.map((answer, itemIndex) => itemIndex === index ? choice : answer)); };
  const retry = () => { setIndex(0); setAnswers(Array.from({ length: questions.length }, () => null)); setComplete(false); };

  if (isComplete) return <section className="lesson-quiz-result" aria-live="polite"><div className="quiz-result-heading"><CheckCircle2 size={23} /><div><p className="section-kicker">10-QUESTION RESULT</p><h2>Таны дүн: {score} / {questions.length}</h2><p>{score === questions.length ? "Маш сайн. Та энэ lesson-ийн ойлголтуудыг олон өнцгөөс зөв таньжээ." : "Тайлбараа уншаад хүсвэл дахин оролдож болно. Аль ч lesson үргэлж нээлттэй."}</p></div></div><div className="quiz-review-list">{questions.map((item, itemIndex) => { const correct = answers[itemIndex] === item.answer; return <article key={item.id} className={correct ? "correct" : "incorrect"}><span>{correct ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}</span><div><p className="section-kicker">{String(itemIndex + 1).padStart(2, "0")} · {item.label}</p><b>{item.question}</b><p>{correct ? "Зөв. " : `Таны сонголт: ${answers[itemIndex] === null ? "хариулаагүй" : item.choices[answers[itemIndex]!]}. `}{item.explanation}</p></div></article>; })}</div><Button variant="outline" onClick={retry}><RotateCcw size={16} /> 10 асуултаа дахин хийх</Button></section>;

  return <section className="lesson-quiz" aria-labelledby="lesson-quiz-heading"><div className="quiz-topline"><div><p className="section-kicker">10-QUESTION QUIZ · {index + 1} / {questions.length}</p><h2 id="lesson-quiz-heading">{question.question}</h2></div><span className="quiz-kind">{question.label}</span></div><div className="quiz-dots" aria-label={`${answeredCount} / ${questions.length} асуулт хариулсан`}>{questions.map((item, itemIndex) => <i key={item.id} className={itemIndex === index ? "active" : answers[itemIndex] !== null ? "answered" : ""} />)}</div>{question.code && <pre className="quiz-code"><code>{question.code}</code></pre>}<div className="choice-stack">{question.choices.map((choice, choiceIndex) => <button type="button" key={choice} className={answers[index] === choiceIndex ? "quiz-choice selected" : "quiz-choice"} onClick={() => choose(choiceIndex)}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}</button>)}</div><div className="quiz-actions"><Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}><ChevronLeft size={16} /> Өмнөх</Button>{index === questions.length - 1 ? <Button className="atlas-button" disabled={answeredCount !== questions.length} onClick={() => setComplete(true)}>Дүнгээ харах <CheckCircle2 size={16} /></Button> : <Button className="atlas-button" disabled={answers[index] === null} onClick={() => setIndex((current) => current + 1)}>Дараах асуулт <ChevronRight size={16} /></Button>}</div></section>;
}
