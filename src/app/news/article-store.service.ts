import { Injectable } from '@angular/core';
import { Article } from './news.models';

@Injectable({ providedIn: 'root' })
export class ArticleStore {
  private readonly articles = new Map<string, Article>();
  private readonly storagePrefix = 'world-news:article:';

  save(article: Article): void {
    this.articles.set(article.url, article);
    try {
      sessionStorage.setItem(this.storagePrefix + article.url, JSON.stringify(article));
    } catch {
    }
  }

  get(url: string): Article | null {
    const cached = this.articles.get(url);
    if (cached) return cached;

    try {
      const json = sessionStorage.getItem(this.storagePrefix + url);
      if (!json) return null;
      const article: Article = JSON.parse(json);
      if (
        article.url !== url ||
        typeof article.title !== 'string' ||
        typeof article.source?.name !== 'string' ||
        typeof article.publishedAt !== 'string'
      ) return null;
      return article;
    } catch {
      return null;
    }
  }
}
