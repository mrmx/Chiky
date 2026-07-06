# <img src="https://raw.githubusercontent.com/mrmx/Chiqui/main/sites/docs/static/img/logo.svg" alt="Chiqui logo" width="96" height="96" valign="middle" /> Chiqui

[![npm version](https://img.shields.io/npm/v/@mrmx/chiqui.svg)](https://www.npmjs.com/package/@mrmx/chiqui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mrmx/Chiqui/blob/main/LICENSE)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-ff3e00.svg?logo=svelte)](https://svelte.dev/docs/kit)

Content-driven SvelteKit SSG framework with i18n, mdsvex content pipeline, and DaisyUI components.

Chiqui is a lightweight static site generator built on top of [SvelteKit](https://svelte.dev/docs/kit). It is designed for small product sites, documentation sites, and multilingual static websites where Markdown content is the source of truth.

## Install

```bash
pnpm add @mrmx/chiqui
```

Peer dependencies: `@sveltejs/kit ^2`, `svelte ^5`.

## Features

- Markdown-first content in `content/{lang}/`.
- Built-in i18n routing with canonical IDs across translations.
- SvelteKit static generation with [mdsvex](https://github.com/pngwn/MDsveX).
- Type-safe site config for metadata, languages, and navigation.
- Header, footer, logo, language selector, theme toggle, hero, carousel, and icon components.
- Content validation for duplicate routes, missing IDs, and translation lookup issues.
- Shared Vite and Svelte config helpers for consistent consumer projects.

## Quick Start

### 1. Root `config.ts`

```ts
import type { AppConfig } from '@mrmx/chiqui';

const config: AppConfig = {
	site: {
		name: 'My Site',
		logoUrl: '/img/logo.svg',
		copyright: 'My Company'
	},
	i18n: {
		defaultLang: 'en',
		supported: ['en', 'es']
	},
	nav: {
		header: {
			show: true,
			items: {
				en: [{ name: 'Home', href: '/en' }],
				es: [{ name: 'Inicio', href: '/es' }]
			}
		},
		footer: { show: true, items: { en: [], es: [] } }
	}
};

export default config;
```

### 2. `src/lib/config.ts`

```ts
import rawConfig from '../../config';
import { initConfig } from '@mrmx/chiqui/config';

initConfig(rawConfig, { validate: true });

export * from '@mrmx/chiqui/config';
```

### 3. `src/lib/content.ts`

```ts
import { createContent } from '@mrmx/chiqui/content';

const modules = import.meta.glob('/content/**/*.md', { eager: true });

export const {
	contents,
	index,
	validateIndex,
	assertValidIndex,
	getContent,
	getTranslatedSlug,
	getHreflangAlternates,
	contentRoutes,
	contentEntries
} = createContent(modules);
```

### 4. Layout

```svelte
<script lang="ts">
	import { Header, Footer } from '@mrmx/chiqui/components';
	import { showFooter } from '$lib/config';
	import { getTranslatedSlug } from '$lib/content';

	let { children } = $props();
</script>

<Header {getTranslatedSlug} />

<main>
	{@render children?.()}
</main>

{#if showFooter()}
	<Footer />
{/if}
```

### 5. Content

Markdown files live in `content/{lang}/{slug}.md` with frontmatter:

```md
---
id: home
title: Welcome
---

Hello world.
```

The `id` is the canonical identifier — use the same `id` across languages to link translations:

```txt
content/en/about.md     # id: about
content/es/acerca.md    # id: about
```

Routes are generated from language + slug:

```txt
content/en/about.md  -> /en/about
content/es/acerca.md -> /es/acerca
content/en/index.md  -> /en
```

### 6. Validate content at build time

`createContent()` builds an index (`bySlug`, `byId`) while parsing your Markdown and
records any problems (duplicate slugs, duplicate `(id, lang)` pairs, missing `id`, ...).
Two ways to act on that:

- `validateIndex()` — logs errors/warnings to the console and returns `false` on error,
  `true` otherwise. Never throws. Kept for backwards compatibility / non-fatal checks.
- `assertValidIndex()` — same accumulated errors, but **throws** instead of returning
  `false`. Warnings are still only `console.warn`'d. For a static site generator,
  shipping with broken content is worse than a red build, so wire it into
  `src/hooks.server.ts`'s `init` hook — SvelteKit calls `init` once during the
  prerendering pass, so a thrown error there fails `pnpm build`:

```ts
// src/hooks.server.ts
import type { ServerInit } from '@sveltejs/kit';
import { assertValidIndex } from '$lib/content';

export const init: ServerInit = async () => {
	assertValidIndex();
};
```

### 7. Static generation (adapter-static + prerender)

Chiqui sites are meant to be prerendered to plain HTML. Install `@sveltejs/adapter-static`
instead of `adapter-auto` and pass it to `createSvelteConfig()`:

```bash
pnpm add -D @sveltejs/adapter-static
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(adapter, vitePreprocess, mdsvex);
```

Opt every route into prerendering:

```ts
// src/routes/+layout.ts
export const prerender = true;
```

If your content lives behind a dynamic route like `src/routes/[[lang]]/[...slug]/+page.ts`
(the pattern used by `sites/docs`), export `entries()` so adapter-static knows which
`lang`/`slug` combinations exist. Use the `contentEntries()` helper exposed by the content
store instead of the raw `contentRoutes` array:

```ts
// src/routes/[[lang]]/[...slug]/+page.ts
import { contentEntries } from '$lib/content';
import { defaultLang } from '$lib/config';

export function entries() {
	// contentEntries() covers every `/{lang}/{slug}` page. The bare `/` root needs an
	// explicit empty-lang entry so it's prerendered too (it renders the defaultLang home
	// page — see load() below).
	return [{ lang: '', slug: '' }, ...contentEntries()];
}

export function load({ params }) {
	let { lang = '', slug } = params;
	if (lang === '') lang = defaultLang();
	// ...getContent(lang, slug) as before
}
```

`pnpm build` then emits a fully static `build/` directory (`index.html`, `en.html`,
`en/about.html`, `es/acerca.html`, ...) that can be served from any static host.

## SEO

Chiqui ships a `<Seo>` component plus a handful of small, independently usable helpers that
together cover per-page tags, `<html lang>`, `sitemap.xml`, and `robots.txt`.

### 1. `site.url` (origin for absolute URLs)

Add an absolute base URL to your root `config.ts` — it's the fallback origin used for
canonical/hreflang/OG URLs and for `sitemap.xml`/`robots.txt`:

```ts
const config: AppConfig = {
	site: {
		name: 'My Site',
		url: 'https://example.com' // no trailing slash needed, it's normalized either way
	}
	// ...
};
```

`siteUrl()` (exported from `@mrmx/chiqui/config`) returns the normalized value (or
`undefined` if unset).

### 2. `<Seo>` component

Render it once per content page — inside `<svelte:head>` it sets `<title>`, meta
description, `<link rel="canonical">`, per-language `hreflang` alternates (+ `x-default`),
basic Open Graph tags, and `twitter:card`:

```svelte
<script lang="ts">
	import { Seo } from '@mrmx/chiqui/components';
	import { getHreflangAlternates } from '$lib/content';

	let { data } = $props();
</script>

<Seo
	lang={data.lang}
	slug={data.slug}
	title={data.metadata?.title}
	description={data.metadata?.description}
	image={data.metadata?.image}
	{getHreflangAlternates}
/>
```

Props:

- `lang`, `slug` — the current page's language and slug (from your route's `load()`).
- `title?`, `description?`, `image?` — typically sourced from frontmatter (`ContentFrontmatter`
  now has optional `description`/`image` fields for this).
- `origin?` — overrides the resolved origin; falls back to `siteUrl()`, then
  `page.url.origin` if neither is set.
- `getHreflangAlternates?` — injected the same way `Header` takes `getTranslatedSlug`; pass
  your content store's `getHreflangAlternates` (from `createContent()`) to get hreflang tags
  and `x-default` (built from the alternate matching your configured `defaultLang`). Omit it
  and only the canonical/OG/title tags render (no hreflang links).

The `og:locale` tag uses the raw 2-letter `lang` value (e.g. `en`, `es`) rather than a full
`xx_YY` locale, since chiqui's i18n only tracks language, not region — a deliberate
simplification.

**Note on canonical vs. hreflang URLs:** `<Seo>` builds its own `<link rel="canonical">` path
(`/{lang}/{slug}`, or just `/{lang}` for the empty-slug home entry — matching the file that's
actually prerendered). The hreflang `<link>` tags, however, come straight from
`getHreflangAlternates()`, which templates hrefs as `${origin}/${lang}/${slug}` — for an
empty slug that's `/{lang}/` **with** a trailing slash, even though the real page is served at
`/{lang}` (no slash). This is a preexisting quirk in `content.ts`'s `getHreflangAlternates`
(GOAL-05 scope explicitly keeps its signature/behavior unchanged), so canonical tags are
always accurate while home-page hreflang/sitemap alternates carry the trailing slash. Most
static hosts treat `/en` and `/en/` as the same resource, but this is worth fixing upstream
in a future pass.

### 3. `<html lang>` via `createLangHandle()`

Since chiqui sites are fully prerendered, `app.html` has no per-request templating — so
`<html lang>` can't just read a Svelte store. Instead, keep a `%lang%` placeholder in
`app.html` and rewrite it in your `handle` hook:

```html
<!-- src/app.html -->
<html lang="%lang%"></html>
```

```ts
// src/hooks.server.ts
import { createLangHandle } from '@mrmx/chiqui/hooks';

export const handle = createLangHandle();
```

`createLangHandle()` resolves the language from the first path segment (`/es/...` → `es`),
falling back to `i18n.defaultLang` for unprefixed or unsupported segments, then rewrites
`%lang%` via SvelteKit's `transformPageChunk`. It reads `defaultLang`/`supported` from your
initialized chiqui config unless you override them: `createLangHandle({ defaultLang, supported })`.

### 4. `sitemap.xml`

`generateSitemapXml()` (from `@mrmx/chiqui/sitemap`) builds a sitemap `urlset` with
`<xhtml:link rel="alternate" hreflang="...">` per translation, sourced from your content
store's `getHreflangAlternates` (Google's recommended way to declare multilingual URL
alternates in a sitemap):

```ts
// src/routes/sitemap.xml/+server.ts
import { generateSitemapXml } from '@mrmx/chiqui/sitemap';
import { contents, getHreflangAlternates } from '$lib/content';
import { siteUrl, defaultLang } from '$lib/config';

// Static route name (no params) — prerendered without needing an `entries()` export.
export const prerender = true;

export function GET() {
	const xml = generateSitemapXml(
		{ contents, getHreflangAlternates },
		siteUrl() ?? 'https://example.com',
		{ defaultLang: defaultLang() }
	);
	return new Response(xml, { headers: { 'content-type': 'application/xml' } });
}
```

`generateSitemapXml(store, origin, options?)` takes the minimal slice of `ContentStore` it
needs (`contents` + `getHreflangAlternates`) rather than requiring the full store type, so
passing your `createContent()` result works as-is. `options.defaultLang` is optional — pass
it to also emit an `hreflang="x-default"` link per URL.

### 5. `robots.txt`

`robots.txt` is plain static content — chiqui doesn't generate it, just place one in your
`static/` directory pointing at your sitemap:

```txt
# sites/docs/static/robots.txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### 6. 404 page

Add a `src/routes/+error.svelte` for in-app errors (e.g. your content route's `load()`
throwing `error(404, ...)` for an unknown slug):

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { siteName } from '$lib/config';
</script>

<svelte:head>
	<title>{siteName()} — {page.status}</title>
</svelte:head>

<h1>{page.status}</h1>
<p>{page.error?.message ?? 'Page not found.'}</p>
<a href="/">Back to home</a>
```

This covers in-app errors for routes SvelteKit knows about, but **`@sveltejs/adapter-static`
does not emit a `404.html` by default** — a request for a path that was never prerendered
(e.g. a typo'd URL) is a job for your static host, not this Svelte page, unless you opt in to
an SPA-style fallback. To get one, pass adapter options yourself (chiqui's
`createSvelteConfig()` calls whatever zero-arg thunk you give it, so no change to the helper
is needed):

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(
	() => adapter({ fallback: '404.html', strict: false }),
	vitePreprocess,
	mdsvex
);
```

Hosts like Vercel/Netlify then serve `404.html` (which renders your `+error.svelte`) for any
unmatched static path. `strict: false` is required alongside `fallback` because it changes
adapter-static's all-routes-must-be-prerendered check. Chiqui's own docs site does not enable
this by default, so verify the interaction with `strict` for your own routes before shipping it.

## Package Exports

- `@mrmx/chiqui` — types (`AppConfig`, `Link`, `Group`, `NavNode`, `ContentEntry`, `NavItem`)
- `@mrmx/chiqui/config` — `initConfig`, `siteName`, `navItems`, `defaultLang`, etc.
- `@mrmx/chiqui/content` — `createContent` factory (exposes `contentEntries()` for
  `entries()` in prerendered dynamic routes, `getContent()` for an O(1) indexed lookup,
  `assertValidIndex()` for strict build-time validation, plus the legacy `contentRoutes`
  array)
- `@mrmx/chiqui/components` — `Header`, `Footer`, `Hero`, `Carousel`, `LanguageSelect`, `LightDarkMode`, `Icon`, `NavLink`, `Seo`, `SiteLogo`
  - `Header` renders `Group` nav nodes as a DaisyUI dropdown submenu (`<details>` inside
    `menu menu-horizontal`), not just flat `Link`s.
  - `Seo` renders per-page `<title>`, canonical, hreflang (+ `x-default`), OG, and Twitter
    card tags — see the SEO section above.
- `@mrmx/chiqui/navigation` — `getLevelContentEntries()` (returns `NavItem[]`, see Breaking
  Changes below), `PartialSlugOptions`, `NavItem`
- `@mrmx/chiqui/hooks` — `createLangHandle()` for `hooks.server.ts` (rewrites the `%lang%`
  placeholder in `app.html`), plus the pure `resolveLangFromPath()` it's built on
- `@mrmx/chiqui/sitemap` — `generateSitemapXml()` for a prerendered `sitemap.xml/+server.ts`
- `@mrmx/chiqui/vite` — `chiquiViteConfig()` for `vite.config.ts` (deep-merges `options.vite`
  via Vite's own `mergeConfig` instead of a shallow spread)
- `@mrmx/chiqui/svelte-config` — `createSvelteConfig()` for `svelte.config.js`, fully typed
  (`Adapter`, `Config` from `@sveltejs/kit`; no `any` in its public signature)
- `@mrmx/chiqui/types` — bare types entry point

## Breaking Changes

- **0.2.0 (unreleased)** — `getLevelContentEntries()` now returns `NavItem[]`
  (`{ lang, slug, title }`) instead of a fabricated `ContentEntry[]` that lacked a real
  `component`/`metadata.id`. If you called `.component` or `.metadata` on its results,
  update to the flat `.title` field instead.

## Working Example

See [`sites/docs`](https://github.com/mrmx/Chiqui/tree/main/sites/docs) in the repo for a complete reference site.

## License

[MIT](https://github.com/mrmx/Chiqui/blob/main/LICENSE) — Copyright © mrmx
