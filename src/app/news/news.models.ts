export type NewsCategory =
  | 'general'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology';

export interface NewsSource {
  id: string | null;
  name: string;
}

export interface Article {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface MockArticle extends Article {
  category: NewsCategory;
}

export interface NewsResponse {
  status: 'ok';
  totalResults: number;
  articles: Article[];
}

export interface NewsErrorResponse {
  status: 'error';
  code: string;
  message: string;
}

export type NewsApiResponse = NewsResponse | NewsErrorResponse;

export interface NewsFilters {
  category: NewsCategory;
  query: string;
  page: number;
}
