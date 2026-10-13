import { Component, output } from '@angular/core';
import { DEFAULT_NEWS_CATEGORY, NEWS_CATEGORIES } from '../../news.constants';
import { NewsCategory } from '../../news.models';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
})
export class CategoryFilter {
  readonly categoryChange = output<NewsCategory>();
  protected readonly categories = NEWS_CATEGORIES;
  protected readonly defaultCategory = DEFAULT_NEWS_CATEGORY;

  protected onCategoryChange(value: string): void {
    const category = this.categories.find((category) => category.value === value);

    if (category) {
      this.categoryChange.emit(category.value);
    }
  }
}
