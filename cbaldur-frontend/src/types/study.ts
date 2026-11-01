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
