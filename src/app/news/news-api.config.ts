import { NEWS_API_KEY } from './news-api.local';

export const NEWS_API_CONFIG = {
  // true: local JSON demo data; false: live NewsAPI requests.
  useMockData: false,
  baseUrl: 'https://newsapi.org/v2',
  apiKey: NEWS_API_KEY,
  country: 'us',
};

