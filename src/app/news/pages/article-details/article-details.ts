import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-details.html',
  styleUrl: './article-details.scss',
})
export class ArticleDetails {}
