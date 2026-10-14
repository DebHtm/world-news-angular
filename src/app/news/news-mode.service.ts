import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NEWS_API_CONFIG } from './news-api.config';

@Injectable({ providedIn: 'root' })
export class NewsMode {
  readonly isDemoMode = signal(NEWS_API_CONFIG.useMockData);
  readonly changes = toObservable(this.isDemoMode);

  toggle(): void {
    this.isDemoMode.update((value) => !value);
  }
}
