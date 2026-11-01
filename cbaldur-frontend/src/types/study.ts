export interface StudyCard {
  id: number;
  paperId: number;
  paperTitle: string;
  kind: 'quiz' | 'flashcard';
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  page: number | null;
  box: number;
  dueAt: string;
}

export interface DueCards {
  items: StudyCard[];
  total: number;
}

export interface StudySummary {
  total: number;
  due: number;
  mastered: number;
  nextDueAt: string | null;
  forecast: { date: string; count: number }[];
  papers: {
    paperId: number;
    title: string;
    total: number;
    due: number;
    mastered: number;
  }[];
}
