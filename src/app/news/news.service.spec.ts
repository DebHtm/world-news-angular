import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NEWS_API_CONFIG } from './news-api.config';
import { NewsService } from './news.service';
import { NewsMode } from './news-mode.service';

describe('NewsService', () => {
  let service: NewsService;
  let http: HttpTestingController;
  let originalKey: string;
  let originalMockMode: boolean;

  beforeEach(() => {
    originalKey = NEWS_API_CONFIG.apiKey;
    originalMockMode = NEWS_API_CONFIG.useMockData;
    NEWS_API_CONFIG.useMockData = false;
    NEWS_API_CONFIG.apiKey = 'test-key';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    NEWS_API_CONFIG.apiKey = originalKey;
    NEWS_API_CONFIG.useMockData = originalMockMode;
    http.verify();
  });

  it('requests headlines with the configured country and key', () => {
    service.getLatestNews().subscribe((response) => {
      expect(response.totalResults).toBe(0);
    });
    const request = http.expectOne((req) => req.url.endsWith('/top-headlines'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('country')).toBe('us');
    expect(request.request.params.get('apiKey')).toBe('test-key');
    expect(request.request.params.get('pageSize')).toBe('100');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('includes the selected category', () => {
    service.getCategoryNews('sports', 2).subscribe();
    const request = http.expectOne((req) => req.params.get('category') === 'sports');
    expect(request.request.url).toBe(NEWS_API_CONFIG.baseUrl + '/top-headlines');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('searches the same headline endpoint with keyword, category, and page', () => {
    service.searchNews('  Poland  ', 'general', 2).subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/top-headlines'));
    expect(request.request.params.get('q')).toBe('Poland');
    expect(request.request.params.get('country')).toBe('us');
    expect(request.request.params.get('category')).toBe('general');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('rejects blank searches without making a request', () => {
    service.searchNews('   ').subscribe({
      next: () => {
        throw new Error('Expected an error');
      },
      error: (error: Error) => expect(error.message).toContain('search keyword'),
    });
    http.expectNone(() => true);
  });

  it('rejects a missing API key without making a request', () => {
    NEWS_API_CONFIG.apiKey = '';
    service.getLatestNews().subscribe({
      next: () => {
        throw new Error('Expected an error');
      },
      error: (error: Error) => expect(error.message).toContain('news-api.local.ts'),
    });
    http.expectNone(() => true);
  });

  it('reports rate limits as errors rather than empty results', () => {
    service.getLatestNews().subscribe({
      next: () => {
        throw new Error('Expected an error');
      },
      error: (error: Error) => expect(error.message).toContain('request limit'),
    });
    http
      .expectOne(() => true)
      .flush(
        { status: 'error', code: 'rateLimited', message: 'Rate limited' },
        { status: 429, statusText: 'Too Many Requests' },
      );
  });

  it('handles an API error returned in a successful HTTP response', () => {
    service.getLatestNews().subscribe({
      next: () => {
        throw new Error('Expected an error');
      },
      error: (error: Error) => expect(error.message).toBe('API unavailable'),
    });
    http
      .expectOne(() => true)
      .flush({
        status: 'error',
        code: 'unexpectedError',
        message: 'API unavailable',
      });
  });

  it('fills local pages from actual results and reuses the snapshot', () => {
    const articles = Array.from({ length: 17 }, (_, index) => ({
      title: 'Article ' + index,
      url: 'https://example.com/' + index,
      source: { id: null, name: 'Example' },
      author: null, description: null, content: null, urlToImage: null,
      publishedAt: '2026-10-14T09:00:00Z',
    }));
    service.getCategoryNews('general', 1).subscribe((response) => {
      expect(response.articles).toHaveLength(6);
      expect(response.totalResults).toBe(17);
    });
    http.expectOne(() => true).flush({ status: 'ok', articles, totalResults: 20 });
    service.getCategoryNews('general', 2).subscribe((response) => {
      expect(response.articles).toEqual(articles.slice(6, 12));
    });
    service.getCategoryNews('general', 3).subscribe((response) => {
      expect(response.articles).toHaveLength(5);
    });
    http.expectNone(() => true);
  });

  it('loads demo JSON without a key and filters, paginates, and reuses it', () => {
    NEWS_API_CONFIG.useMockData = true;
    TestBed.inject(NewsMode).isDemoMode.set(true);
    NEWS_API_CONFIG.apiKey = '';
    const articles = Array.from({ length: 8 }, (_, index) => ({
      category: 'general', title: index === 0 ? 'Poland demo headline' : 'Demo ' + index,
      url: 'https://example.com/demo/' + index,
      source: { id: null, name: 'Demo' }, publishedAt: '2026-10-14T09:00:00Z',
      author: null, description: null, content: null, urlToImage: null,
    }));
    service.getCategoryNews('general').subscribe((response) => {
      expect(response.articles).toHaveLength(6);
      expect(response.totalResults).toBe(8);
    });
    http.expectOne('/data/news.mock.json').flush(articles);
    service.getCategoryNews('general', 2).subscribe((response) => {
      expect(response.articles).toHaveLength(2);
    });
    service.searchNews('poland').subscribe((response) => {
      expect(response.articles[0].title).toBe('Poland demo headline');
      expect(response.totalResults).toBe(1);
    });
    service.getCategoryNews('sports').subscribe((response) => {
      expect(response.articles).toHaveLength(0);
    });
    http.expectNone(() => true);
  });
});
