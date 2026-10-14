# World News

A junior frontend assignment built with Angular 21 standalone components,
TypeScript, Angular Router, RxJS, and custom SCSS.

## Features

- Browse headlines from NewsAPI.
- Select General, Business, Entertainment, Health, Science, Sports, or Technology.
- Search headlines within the selected category with a 350 ms delay.
- Browse six articles per page with Previous and Next controls.
- Preserve category, keyword, and page in URL query parameters.
- View article details and open the publisher's original article.
- Display loading, error, and empty states.
- Use a responsive layout with shared SCSS color and typography variables.

## Requirements

- Node.js 22.12 or later in the Node.js 22 release line.
- npm.
- A NewsAPI key for live requests: https://newsapi.org/register

## Local setup

Install the dependencies recorded in the lockfile:

```bash
npm ci
```

In PowerShell, create your local API configuration:

```powershell
Copy-Item src/app/news/news-api.local.example.ts src/app/news/news-api.local.ts
```

Edit `src/app/news/news-api.local.ts`:

```ts
export const NEWS_API_KEY = 'YOUR_NEWSAPI_KEY';
```

The local file is ignored by Git. The committed `news-api.config.ts` imports
it and defines the API base URL and headline country. Create the local file
before building or testing, even if its key is empty for mocked tests.

Start the application:

```bash
npm start
```

Open http://localhost:4200/news.

## Validation

```bash
npm test -- --watch=false
npm run build
```

Tests use Vitest and mocked HTTP responses, so they do not consume API quota.
Keep the `.spec.ts` files in the repository; they are excluded from the production bundle.
Build output is written to `dist/`.

## Architecture

```text
src/
  app/
    app.ts / app.html / app.scss    Root shell
    app.config.ts                  Application providers
    app.routes.ts                  Lazy-loaded page routes
    news/
      pages/news-list/             Filters, URL state, loading, pagination
      pages/article-details/       Saved article and publisher link
      components/article-card/     Article preview and details navigation
      components/category-filter/  Category input and selection output
      components/search-bar/       Search input and text output
      news.service.ts              API requests, caching, local pagination
      article-store.service.ts     Selected article storage
      news.models.ts               Data interfaces and types
      news.constants.ts            Categories and UI page size
      news-api.config.ts           Public configuration
      news-api.local.example.ts    Credential setup template
      news-api.local.ts            Ignored local credentials
  styles/                          Colors, typography, control mixin
  styles.scss                      Global styles
```

Example list URL: `/news?category=sports&q=football&page=2`.
Article links preserve these parameters so returning restores the list state.

## API behavior and limitations

- Requests use NewsAPI's `/v2/top-headlines` endpoint with US coverage.
- Search sends a keyword and the selected category to the API; it is not a local text filter.
- The service requests batches of up to 100 articles, removes duplicate URLs,
  and creates six-article UI pages from the actual results.
- Headline snapshots are cached in memory for five minutes. Reloading clears the cache.
- Selected articles are also saved in `sessionStorage` for same-tab refresh support.
  A details link opened in another browser may show an unavailable message.
- Article content is an excerpt. The publisher link provides the original article.
- NewsAPI's free Developer plan currently allows 100 requests per day and is
  intended for local development/testing, with localhost browser access.
  Check current terms at https://newsapi.org/pricing before deployment.
- A frontend API key remains visible in browser requests and compiled code.
  The ignored file prevents accidental Git commits; a backend is needed to keep a key secret.
- No demo mode or automatic retries are implemented.

## Publishing the source to GitHub

For this repository, the branch is already `main` and the `origin` remote is configured.
After reviewing your changes:

```bash
git status
git check-ignore src/app/news/news-api.local.ts
git add .
git diff --cached --stat
git diff --cached
git commit -m "Complete World News application and document setup"
git push -u origin main
```

Review the staged diff locally and make sure it contains no real API key.
The `-u` option sets the upstream branch, allowing later pushes with just `git push`.
Do not commit `node_modules/`, `dist/`, `.angular/`, or the local credential file.
If a key was previously committed or shared, rotate it; deleting it from the
current file does not remove it from Git history.
