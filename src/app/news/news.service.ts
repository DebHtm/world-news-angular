import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { NEWS_API_CONFIG } from './news-api.config';
import { NEWS_PAGE_SIZE } from './news.constants';
import { NewsApiResponse, NewsCategory, NewsResponse } from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);

  getLatestNews(): Observable<NewsResponse> {
    return this.request('top-headlines', { country: NEWS_API_CONFIG.country });
  }

  getCategoryNews(category: NewsCategory): Observable<NewsResponse> {
    return this.request('top-headlines', {
      country: NEWS_API_CONFIG.country,
      category,
    });
  }

  searchNews(keyword: string): Observable<NewsResponse> {
    const query = keyword.trim();

    if (!query) {
      return throwError(() => new Error('Please enter a search keyword.'));
    }

    return this.request('everything', {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
    });
  }

  private request(
    endpoint: string,
    queryParams: Record<string, string>,
  ): Observable<NewsResponse> {
    if (!NEWS_API_CONFIG.apiKey.trim()) {
      return throwError(() => new Error('Add your NewsAPI key in news-api.config.ts.'));
    }

    const params = new HttpParams({
      fromObject: {
        ...queryParams,
        apiKey: NEWS_API_CONFIG.apiKey,
        pageSize: NEWS_PAGE_SIZE,
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
