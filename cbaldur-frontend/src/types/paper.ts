export interface Paper {
  id: number;
  title: string;
  authors: string;
  year: number;
  abstract: string;
  tags: string[];
  sourceUrl?: string;
  downloadUrl: string;
  hasLocalFile: boolean;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
}

export interface PaperPagedResult {
  items: Paper[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GlobalPaper {
  id: string;
  title: string;
  authors: string;
  year?: number;
  abstract?: string;
  url?: string;
  pdfUrl?: string;
}

export interface PaperSearchResponse {
  query: string;
  totalCount: number;
  papers: GlobalPaper[];
}

export interface CreatePaper {
  title: string;
  authors: string;
  year: number;
  abstract?: string;
  tags?: string;
  url?: string;
  file?: File;
}
