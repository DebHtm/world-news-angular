import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NEWS_API_CONFIG } from './news-api.config';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;
  let http: HttpTestingController;
  let originalKey: string;

  beforeEach(() => {
    originalKey = NEWS_API_CONFIG.apiKey;
    NEWS_API_CONFIG.apiKey = 'test-key';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    NEWS_API_CONFIG.apiKey = originalKey;
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
    expect(request.request.params.get('pageSize')).toBe('20');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('includes the selected category', () => {
    service.getCategoryNews('sports').subscribe();
    const request = http.expectOne((req) => req.params.get('category') === 'sports');
    expect(request.request.url).toBe(NEWS_API_CONFIG.baseUrl + '/top-headlines');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('trims keywords and searches newest English articles', () => {
    service.searchNews('  climate & science  ').subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/everything'));
    expect(request.request.params.get('q')).toBe('climate & science');
    expect(request.request.params.get('language')).toBe('en');
    expect(request.request.params.get('sortBy')).toBe('publishedAt');
    request.flush({ status: 'ok', totalResults: 0, articles: [] });
  });

  it('rejects blank searches without making a request', () => {
    service.searchNews('   ').subscribe({
      next: () => { throw new Error('Expected an error'); },
      error: (error: Error) => expect(error.message).toContain('search keyword'),
    });
    http.expectNone(() => true);
  });

  it('rejects a missing API key without making a request', () => {
    NEWS_API_CONFIG.apiKey = '';
    service.getLatestNews().subscribe({
      next: () => { throw new Error('Expected an error'); },
      error: (error: Error) => expect(error.message).toContain('news-api.config.ts'),
    });
    http.expectNone(() => true);
  });

  it('reports rate limits as errors rather than empty results', () => {
    service.getLatestNews().subscribe({
      next: () => { throw new Error('Expected an error'); },
      error: (error: Error) => expect(error.message).toContain('request limit'),
    });
    http.expectOne(() => true).flush(
      { status: 'error', code: 'rateLimited', message: 'Rate limited' },
      { status: 429, statusText: 'Too Many Requests' },
    );
  });

  it('handles an API error returned in a successful HTTP response', () => {
    service.getLatestNews().subscribe({
      next: () => { throw new Error('Expected an error'); },
      error: (error: Error) => expect(error.message).toBe('API unavailable'),
    });
    http.expectOne(() => true).flush({
      status: 'error', code: 'unexpectedError', message: 'API unavailable',
    });
  });
});
