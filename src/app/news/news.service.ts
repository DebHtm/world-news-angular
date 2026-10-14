import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, expand, map, Observable, of, reduce, throwError } from 'rxjs';
import { NEWS_API_CONFIG } from './news-api.config';
import { DEFAULT_NEWS_CATEGORY, NEWS_PAGE_SIZE } from './news.constants';
import { NewsApiResponse, NewsCategory, NewsResponse } from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly headlineCache = new Map<string, { response: NewsResponse; savedAt: number }>();

  private getHeadlinePage(params: Record<string, string>, page: number): Observable<NewsResponse> {
    const key = JSON.stringify(params);
    const cached = this.headlineCache.get(key);
    const snapshot = cached && Date.now() - cached.savedAt < 5 * 60_000
      ? of(cached.response)
      : this.request('top-headlines', { ...params, page: '1' }).pipe(
          // Fetch any further API batches before creating local six-article pages.
          expand((response, index) =>
            response.articles.length > 0 && (index + 1) * 100 < response.totalResults
              ? this.request('top-headlines', { ...params, page: String(index + 2) })
              : EMPTY,
          ),
          reduce((articles: NewsResponse['articles'], response) => [...articles, ...response.articles], []),
          map((articles): NewsResponse => {
            const unique = [...new Map(articles.map((article) => [article.url, article])).values()];
            const response: NewsResponse = { status: 'ok', articles: unique, totalResults: unique.length };
            this.headlineCache.set(key, { response, savedAt: Date.now() });
            return response;
          }),
        );

    return snapshot.pipe(map((response) => ({
      ...response,
      articles: response.articles.slice((page - 1) * NEWS_PAGE_SIZE, page * NEWS_PAGE_SIZE),
    })));
  }

  getLatestNews(page = 1): Observable<NewsResponse> {
    return this.getHeadlinePage({ country: NEWS_API_CONFIG.country }, page);
  }

  getCategoryNews(category: NewsCategory, page = 1): Observable<NewsResponse> {
    return this.getHeadlinePage({
      country: NEWS_API_CONFIG.country,
      category,
    }, page);
  }

  searchNews(
    keyword: string,
    category: NewsCategory = DEFAULT_NEWS_CATEGORY,
    page = 1,
  ): Observable<NewsResponse> {
    const query = keyword.trim();

    if (!query) {
      return throwError(() => new Error('Please enter a search keyword.'));
    }

    return this.getHeadlinePage({
      q: query,
      country: NEWS_API_CONFIG.country,
      category,
    }, page);
  }

  private request(endpoint: string, queryParams: Record<string, string>): Observable<NewsResponse> {
    if (!NEWS_API_CONFIG.apiKey.trim()) {
      return throwError(() => new Error('Add your NewsAPI key in news-api.config.ts.'));
    }

    const params = new HttpParams({
      fromObject: {
        ...queryParams,
        apiKey: NEWS_API_CONFIG.apiKey,
        pageSize: 100,
      },
    });

    return this.http
      .get<NewsApiResponse>(`${NEWS_API_CONFIG.baseUrl}/${endpoint}`, { params })
      .pipe(
        map((response) => {
          if (response.status === 'error') {
            throw new Error(response.message);
          }

          return response;
        }),
        catchError((error: unknown) => {
          let message = 'Unable to load news. Please try again later.';

          if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
              message = 'Unable to reach the news API. Check your connection and API access.';
            } else if (error.status === 401) {
              message = 'Your NewsAPI key is missing or invalid.';
            } else if (error.status === 429) {
              message = 'The news API request limit has been reached. Please try again later.';
            }
          } else if (error instanceof Error) {
            message = error.message;
          }

          return throwError(() => new Error(message));
        }),
      );
  }
}
