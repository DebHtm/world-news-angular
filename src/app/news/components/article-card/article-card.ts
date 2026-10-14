import { DatePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleStore } from '../../article-store.service';
import { Article } from '../../news.models';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './article-card.html',
  styleUrl: './article-card.scss',
})
export class ArticleCard {
  private readonly articleStore = inject(ArticleStore);
  @Input({ required: true }) article!: Article;

  protected saveArticle(): void {
    this.articleStore.save(this.article);
  }
}
