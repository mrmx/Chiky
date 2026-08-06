---
title: Getting started
description: What "headless" means here, and why this whole site is the example.
order: 1
---

This site *is* the documentation for the pattern it demonstrates — every page you're
reading right now is rendered through `@mrmx/chiqui`'s headless content engine, and this
page explains exactly how.

## What "headless" means

`@mrmx/chiqui` normally owns a whole site: routing, i18n, `<Header>`/`<Footer>`, static
generation (see `sites/docs` in the same repo). Headless usage is the opposite — this app
uses **only** the content engine (`@mrmx/chiqui/content` + `/navigation`), never
`@mrmx/chiqui/components`. Everything you're looking at — the sidebar, this page's layout,
the previous/next pager — is this app's own code, not chiqui's.

## The three pieces

**1. The content engine** — `src/lib/docs.ts`:

```ts
const modules = import.meta.glob('./docs/content/*/*.md', { eager: true });

export const docs = createDocsSection(modules, {
	basePath: './docs/content/',
	defaultLang: 'en'
});
```

One call. `docs.navFor(lang)` builds the sidebar, `docs.resolve(lang, slug)` fetches a page
(with `assertValidIndex()` already run, so a duplicate slug fails the build instead of
shipping broken navigation), `docs.neighbors(lang, slug)` gives the pager below.

**2. The markdown preprocessor** — `svelte.config.js`:

```js
import { createChiquiPreprocessor } from '@mrmx/chiqui/svelte-config';

export default {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), createChiquiPreprocessor()],
	kit: { adapter: adapter() }
};
```

`mdsvex` itself isn't installed in this app — chiqui *is* an mdsvex content pipeline, so it
brings and applies it. Note `adapter-auto`, not `adapter-static`: nothing here is
prerendered. Headless usage doesn't require chiqui's static-generation story at all.

**3. Your own routes** — `src/routes/[...slug]/+page.ts` resolves the slug (defaulting to
`docs.defaultSlug` for the bare `/`, 404ing via `docs.hasSlug()` otherwise);
`src/routes/+layout.svelte` renders the sidebar you see on the left, from
`docs.navFor('en')`, on every page.

See [FAQ](/faq) for the file-by-file breakdown.
