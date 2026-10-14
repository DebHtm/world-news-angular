import { NewsCategory } from './news.models';

export const NEWS_CATEGORIES: ReadonlyArray<{ value: NewsCategory; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
];

export const DEFAULT_NEWS_CATEGORY: NewsCategory = 'general';
export const NEWS_PAGE_SIZE = 6;
