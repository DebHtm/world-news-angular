import { Component } from '@angular/core';
import { ArticleCard } from '../../components/article-card/article-card';
import { CategoryFilter } from '../../components/category-filter/category-filter';
import { SearchBar } from '../../components/search-bar/search-bar';
import { DEFAULT_NEWS_CATEGORY } from '../../news.constants';
import { Article, NewsCategory } from '../../news.models';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [ArticleCard, CategoryFilter, SearchBar],
  templateUrl: './news-list.html',
  styleUrl: './news-list.scss',
})
export class NewsList {
  protected searchQuery = '';
  protected selectedCategory: NewsCategory = DEFAULT_NEWS_CATEGORY;

  protected onCategoryChange(category: NewsCategory): void {
    this.selectedCategory = category;
  }

  protected onSearchChange(value: string): void {
    this.searchQuery = value;
  }

  protected readonly mockArticle: Article = {
    source: { id: null, name: 'World News Demo' },
    author: null,
    title: 'New community park opens in the city',
    description:
      'Residents can enjoy walking paths, green spaces, and a playground in the new community park.',
    url: 'https://example.com/community-park',
    urlToImage: '/images/mock-news.svg',
    publishedAt: '2026-10-13T09:00:00Z',
    content: null,
  };
}
