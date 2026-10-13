import { Component } from '@angular/core';
import { ArticleCard } from '../../components/article-card/article-card';
import { CategoryFilter } from '../../components/category-filter/category-filter';
import { SearchBar } from '../../components/search-bar/search-bar';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [ArticleCard, CategoryFilter, SearchBar],
  templateUrl: './news-list.html',
  styleUrl: './news-list.scss',
})
export class NewsList {}
