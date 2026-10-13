import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Article } from '../../news.models';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './article-card.html',
  styleUrl: './article-card.scss',
})
export class ArticleCard {
  @Input({ required: true }) article!: Article;
}
