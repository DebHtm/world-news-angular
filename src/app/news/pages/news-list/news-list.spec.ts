import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { vi } from 'vitest';
import { CategoryFilter } from '../../components/category-filter/category-filter';
import { SearchBar } from '../../components/search-bar/search-bar';
import { NewsResponse } from '../../news.models';
import { NewsService } from '../../news.service';
import { NewsList } from './news-list';

describe('NewsList filters', () => {
  const emptyResponse: NewsResponse = { status: 'ok', totalResults: 0, articles: [] };

  afterEach(() => vi.useRealTimers());

  async function setup(initialParams: Record<string, string> = {}, totalResults = 0) {
    const params = new BehaviorSubject(convertToParamMap(initialParams));
    const router = {
      navigate: vi.fn((_commands, options) => {
        params.next(convertToParamMap(options.queryParams));
        return Promise.resolve(true);
      }),
    };
    const service = {
      getCategoryNews: vi.fn(() => of({ ...emptyResponse, totalResults })),
      searchNews: vi.fn(() => of(emptyResponse)),
    };
    await TestBed.configureTestingModule({
      imports: [NewsList],
      providers: [
        { provide: NewsService, useValue: service },
        { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewsList);
    fixture.detectChanges();
    const search = fixture.debugElement.query(By.directive(SearchBar))
      .componentInstance as SearchBar;
    const category = fixture.debugElement.query(By.directive(CategoryFilter))
      .componentInstance as CategoryFilter;
    return { fixture, service, search, category, router };
  }

  it('debounces typing and restores the selected category when search is cleared', async () => {
    const { service, search, category } = await setup();
    vi.useFakeTimers();
    expect(service.getCategoryNews).toHaveBeenCalledWith('general', 1);
    category.categoryChange.emit('sports');
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('sports', 1);
    search.searchChange.emit('ang');
    await vi.advanceTimersByTimeAsync(200);
    search.searchChange.emit(' angular ');
    await vi.advanceTimersByTimeAsync(349);
    expect(service.searchNews).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(service.searchNews).toHaveBeenCalledExactlyOnceWith('angular', 'sports', 1);
    search.searchChange.emit('');
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('sports', 1);
  });

  it('cancels stale requests and continues after an error', async () => {
    const { fixture, service, category } = await setup();
    const stale = new Subject<NewsResponse>();
    const failed = new Subject<NewsResponse>();
    service.getCategoryNews.mockReturnValueOnce(stale);
    category.categoryChange.emit('sports');
    service.getCategoryNews.mockReturnValueOnce(failed);
    category.categoryChange.emit('health');
    expect(stale.observed).toBe(false);
    failed.error(new Error('Request failed'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Request failed',
    );
    category.categoryChange.emit('technology');
    fixture.detectChanges();
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('technology', 1);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No news articles found.');
  });

  it('restores the category and its headlines when the list is recreated after navigation', async () => {
    const { fixture, service, category } = await setup();
    category.categoryChange.emit('sports');
    fixture.destroy();
    service.getCategoryNews.mockClear();

    const returnedList = TestBed.createComponent(NewsList);
    returnedList.detectChanges();

    expect(service.getCategoryNews).toHaveBeenCalledExactlyOnceWith('sports', 1);
    const select = returnedList.nativeElement.querySelector('#news-category') as HTMLSelectElement;
    expect(select.value).toBe('sports');
    returnedList.destroy();
  });

  it('restores category and search controls directly from a refreshed URL', async () => {
    const { fixture, service } = await setup({ category: 'sports', q: 'football' });
    expect((fixture.nativeElement.querySelector('#news-category') as HTMLSelectElement).value).toBe(
      'sports',
    );
    expect((fixture.nativeElement.querySelector('#news-search') as HTMLInputElement).value).toBe(
      'football',
    );
    vi.useFakeTimers();
    // The initial search timer was started before fake timers were enabled.
    fixture.destroy();
    const refreshed = TestBed.createComponent(NewsList);
    refreshed.detectChanges();
    await vi.advanceTimersByTimeAsync(350);
    expect(service.searchNews).toHaveBeenCalledWith('football', 'sports', 1);
    refreshed.destroy();
  });

  it('falls back to General for an unsupported category in the URL', async () => {
    const { fixture, service } = await setup({ category: 'unsupported' });
    expect(service.getCategoryNews).toHaveBeenCalledExactlyOnceWith('general', 1);
    expect((fixture.nativeElement.querySelector('#news-category') as HTMLSelectElement).value).toBe(
      'general',
    );
  });

  it('restores page from the URL and moves between pages', async () => {
    const { fixture, service, router, category } = await setup(
      { category: 'sports', page: '2' },
      18,
    );
    expect(service.getCategoryNews).toHaveBeenCalledExactlyOnceWith('sports', 2);
    expect(fixture.nativeElement.textContent).toContain('Page 2 of 3');
    const buttons = fixture.nativeElement.querySelectorAll('.pagination button');
    buttons[1].click();
    fixture.detectChanges();
    expect(router.navigate.mock.lastCall?.[1].queryParams.page).toBe(3);
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('sports', 3);
    expect(fixture.nativeElement.textContent).toContain('Page 3 of 3');
    expect(buttons[1].disabled).toBe(true);
    category.categoryChange.emit('health');
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('health', 1);
  });

  it('uses page 1 for an invalid URL page and clamps pages past the last result', async () => {
    const { service, router } = await setup({ page: '-2' }, 12);
    expect(service.getCategoryNews).toHaveBeenCalledExactlyOnceWith('general', 1);
    await router.navigate([], { queryParams: { category: 'general', page: 99 } });
    expect(service.getCategoryNews).toHaveBeenLastCalledWith('general', 2);
    expect(router.navigate.mock.lastCall?.[1].queryParams.page).toBe(2);
  });
});
