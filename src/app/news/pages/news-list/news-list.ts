import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, distinctUntilChanged, EMPTY, map, of, switchMap, tap, timer } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleCard } from '../../components/article-card/article-card';
import { CategoryFilter } from '../../components/category-filter/category-filter';
import { SearchBar } from '../../components/search-bar/search-bar';
import { DEFAULT_NEWS_CATEGORY, NEWS_CATEGORIES, NEWS_PAGE_SIZE } from '../../news.constants';
import { Article, NewsCategory } from '../../news.models';
import { NewsService } from '../../news.service';
import { NewsMode } from '../../news-mode.service';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [ArticleCard, CategoryFilter, SearchBar],
  templateUrl: './news-list.html',
  styleUrl: './news-list.scss',
})
export class NewsList implements OnInit {
  private readonly newsMode = inject(NewsMode);
  protected readonly isDemoMode = this.newsMode.isDemoMode;
  private readonly newsService = inject(NewsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly articles = signal<Article[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalResults = signal(0);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalResults() / NEWS_PAGE_SIZE)),
  );

  ngOnInit(): void {
    combineLatest([this.route.queryParamMap, this.newsMode.changes])
      .pipe(
        map(([params, isDemoMode]) => ({
          isDemoMode,
          category:
            NEWS_CATEGORIES.find((item) => item.value === params.get('category'))?.value ??
            DEFAULT_NEWS_CATEGORY,
          query: (params.get('q') ?? '').trim(),
          page: this.parsePage(params.get('page')),
        })),
        tap(({ category, query, page }) => {
          this.selectedCategory = category;
          this.searchQuery = query;
          this.currentPage.set(page);
        }),
        distinctUntilChanged(
          (previous, current) =>
            previous.category === current.category &&
            previous.query === current.query &&
            previous.isDemoMode === current.isDemoMode &&
            previous.page === current.page,
        ),
        switchMap(({ category, query, page }) => {
          this.loading.set(true);
          this.errorMessage.set('');
          this.articles.set([]);

          return (query ? timer(350) : of(0)).pipe(
            switchMap(() =>
              query
                ? this.newsService.searchNews(query, category, page)
                : this.newsService.getCategoryNews(category, page),
            ),
            tap((response) => {
              this.totalResults.set(response.totalResults);
              const lastPage = Math.max(1, Math.ceil(response.totalResults / NEWS_PAGE_SIZE));
              if (page > lastPage) {
                this.updateFilters(lastPage, true);
                return;
              }
              this.articles.set(response.articles);
              this.loading.set(false);
            }),
            catchError((error: Error) => {
              this.errorMessage.set(error.message);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected searchQuery = '';
  protected selectedCategory: NewsCategory = DEFAULT_NEWS_CATEGORY;

  protected onCategoryChange(category: NewsCategory): void {
    this.selectedCategory = category;
    this.updateFilters();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery = value;
    this.updateFilters();
  }

  protected onPageChange(page: number): void {
    if (!this.loading() && page >= 1 && page <= this.totalPages()) {
      this.updateFilters(page, false);
    }
  }

  private parsePage(value: string | null): number {
    const page = Number(value);
    return Number.isSafeInteger(page) && page > 0 ? page : 1;
  }

  private updateFilters(page = 1, replaceUrl = true): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCategory,
        q: this.searchQuery.trim() || null,
        page,
      },
      replaceUrl,
    });
  }
}
