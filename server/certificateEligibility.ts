export type CompletionSignals = {
  requiredCourseIds: string[];
  completedCourseIds: string[];
  passedCourseIds: string[];
};

export type CertificateEligibility = CompletionSignals & {
  eligible: boolean;
  missingCompletionIds: string[];
  missingQuizIds: string[];
};

/** A certificate requires both durable lesson completion and a passed quiz for every published course. */
export function evaluateCertificateEligibility(signals: CompletionSignals): CertificateEligibility {
  const completed = new Set(signals.completedCourseIds);
  const passed = new Set(signals.passedCourseIds);
  const required = Array.from(new Set(signals.requiredCourseIds));
  const missingCompletionIds = required.filter((courseId) => !completed.has(courseId));
  const missingQuizIds = required.filter((courseId) => !passed.has(courseId));

  return {
    requiredCourseIds: required,
    completedCourseIds: Array.from(completed),
    passedCourseIds: Array.from(passed),
    missingCompletionIds,
    missingQuizIds,
    eligible: required.length > 0 && missingCompletionIds.length === 0 && missingQuizIds.length === 0,
  };
}
