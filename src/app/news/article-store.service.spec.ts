import { ArticleStore } from './article-store.service';
import { Article } from './news.models';

describe('ArticleStore', () => {
  const article: Article = {
    title: 'Test article',
    url: 'https://example.com/test-article',
    source: { id: null, name: 'Test source' },
    publishedAt: '2026-10-14T09:00:00Z',
    description: null,
    content: null,
    author: null,
    urlToImage: null,
  };
  const key = 'world-news:article:' + article.url;

  afterEach(() => sessionStorage.removeItem(key));

  it('restores a saved article in a new service instance after refresh', () => {
    new ArticleStore().save(article);
    expect(new ArticleStore().get(article.url)).toEqual(article);
  });

  it('returns null for an unavailable article', () => {
    expect(new ArticleStore().get('https://example.com/missing')).toBeNull();
  });

  it('handles corrupted storage without crashing', () => {
    sessionStorage.setItem(key, '{invalid');
    expect(new ArticleStore().get(article.url)).toBeNull();
    sessionStorage.setItem(key, JSON.stringify({ url: article.url }));
    expect(new ArticleStore().get(article.url)).toBeNull();
  });
});
