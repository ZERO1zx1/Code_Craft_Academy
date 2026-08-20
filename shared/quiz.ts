import type { QuizQuestion } from "./curriculum";

export function scoreQuizAnswers(questions: QuizQuestion[], answers: number[]) {
  const total = questions.length;
  const correct = questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
  return {
    correct,
    total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}
