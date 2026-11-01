export interface Note {
  id: number;
  paperId: number;
  paperTitle: string;
  page: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotePage {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
}
