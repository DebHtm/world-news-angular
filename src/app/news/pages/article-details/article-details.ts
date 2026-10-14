import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ArticleStore } from '../../article-store.service';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './article-details.html',
  styleUrl: './article-details.scss',
})
export class ArticleDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly articleStore = inject(ArticleStore);

  protected readonly listParams = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        category: params.get('category'),
        q: params.get('q'),
        page: params.get('page'),
      })),
    ),
    { initialValue: { category: null, q: null, page: null } },
  );

  protected readonly article = toSignal(
    this.route.queryParamMap.pipe(map((params) => this.articleStore.get(params.get('url') ?? ''))),
    { initialValue: null },
  );
}
