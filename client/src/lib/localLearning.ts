export type LocalLearningState = {
  portfolioChecklistIds: string[];
};

const STORAGE_KEY = "codecraft-academy-free-learning-v1";
const initialState: LocalLearningState = { portfolioChecklistIds: [] };

export function normalizeLearningState(value: Partial<LocalLearningState> | null | undefined): LocalLearningState {
  return { portfolioChecklistIds: Array.from(new Set(value?.portfolioChecklistIds ?? [])) };
}

export function readLearningState(): LocalLearningState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeLearningState(JSON.parse(raw)) : initialState;
  } catch {
    return initialState;
  }
}

export function writeLearningState(next: LocalLearningState): LocalLearningState {
  const normalized = normalizeLearningState(next);
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch { /* Continue without persistence when storage is unavailable. */ }
  }
  return normalized;
}

export function togglePortfolioChecklistItem(itemId: string) {
  const current = readLearningState();
  const itemIds = new Set(current.portfolioChecklistIds);
  if (itemIds.has(itemId)) itemIds.delete(itemId); else itemIds.add(itemId);
  return writeLearningState({ portfolioChecklistIds: Array.from(itemIds) });
}

export function resetPortfolioChecklist() {
  return writeLearningState(initialState);
}
