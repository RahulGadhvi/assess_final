export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionPayload {
  id?: string;
  section?: string;
  text: string;
  options?: QuestionOption[];
}

export interface NormalizedQuestion {
  id: string;
  section: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export function normalizeQuestions(
  questions: QuestionPayload[] | undefined,
  fallbackSection: string
): NormalizedQuestion[] {
  return (questions ?? []).map((question, index) => ({
    id: question.id ?? `question-${index}`,
    section: question.section ?? fallbackSection,
    text: question.text,
    options: (question.options ?? []).map((option, optionIndex) => ({
      id: option.id ?? `option-${index}-${optionIndex}`,
      text: option.text,
      isCorrect: Boolean(option.isCorrect),
    })),
  }));
}
