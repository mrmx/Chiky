# <img src="https://raw.githubusercontent.com/mrmx/Chiqui/main/sites/docs/static/img/logo.svg" alt="Chiqui logo" width="96" height="96" valign="middle" /> Chiqui

[![npm version](https://img.shields.io/npm/v/@mrmx/chiqui.svg)](https://www.npmjs.com/package/@mrmx/chiqui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mrmx/Chiqui/blob/main/LICENSE)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-ff3e00.svg?logo=svelte)](https://svelte.dev/docs/kit)

Content-driven SvelteKit SSG framework with i18n, mdsvex content pipeline, and DaisyUI components.

Chiqui is a content-driven Markdown/i18n toolkit built on top of [SvelteKit](https://svelte.dev/docs/kit). Its most common shape is a small, fully static, multilingual product or documentation site (see [Quick Start](#quick-start)) — but static prerendering is a per-route choice made by the consumer's own SvelteKit config, not something the package enforces, and the content engine (`@mrmx/chiqui/content`, `/navigation`, `/config`) has no dependency on the DaisyUI-based UI components. See [Headless usage](#headless-usage) for embedding just the content engine inside a larger, dynamic app.

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
- Generic rich-content components — `Gallery`, `SpecsTable`, `CtaBand`, `ContactForm` — usable
  straight from Markdown via mdsvex.
- Content validation for duplicate routes, missing IDs, and translation lookup issues.
- Shared Vite and Svelte config helpers for consistent consumer projects.

## Quick Start

The steps below build up to this file layout (matching `sites/docs`, the working example —
see [Working Example](#working-example)):

```txt
my-site/
├── config.ts                              # 1. site/i18n/nav config
├── content/
│   ├── en/index.md                        # 5. Markdown content, one tree per language
│   └── es/index.md
├── static/
│   └── robots.txt                         # SEO §5
├── src/
│   ├── app.html                           # SEO §3 (%lang% placeholder)
│   ├── hooks.server.ts                    # 6. assertValidIndex() + SEO §3 createLangHandle()
│   ├── lib/
│   │   ├── config.ts                      # 2. initConfig() + re-exports
│   │   └── content.ts                     # 3. createContent()
│   └── routes/
│       ├── +layout.ts                     # 7. export const prerender = true
│       ├── +layout.svelte                 # 4. <Layout> (or your own Header/main/Footer)
│       ├── +error.svelte                  # SEO §6, optional
│       ├── sitemap.xml/+server.ts         # SEO §4
│       └── [[lang]]/[...slug]/
│           ├── +page.ts                   # 5. load() + entries() (7. for adapter-static)
│           └── +page.svelte               # 5. <Seo> + the loaded content component
├── svelte.config.js                       # 7. createSvelteConfig()
└── vite.config.ts                         # chiquiViteConfig()
```

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

`src/routes/+layout.svelte` — **`<Layout>` is the zero-config option**: the whole page shell
(`<Header>` on top, a scrollable `<main>` wrapped in `prose` for your Markdown content,
`<Footer>` pinned to the bottom, each conditional on `showHeader()`/`showFooter()`), prebuilt
in one component:

```svelte
<script lang="ts">
	import '@mrmx/chiqui/style.css';
	import { Layout } from '@mrmx/chiqui/components';
	import { getTranslatedSlug } from '$lib/content';

	let { children } = $props();
</script>

<Layout {getTranslatedSlug}>
	{@render children?.()}
</Layout>
```

That's the entire file — no other markup or CSS needed (this is exactly what `sites/docs`
does). Reach instead for `<Header>`/`<Footer>` as loose pieces, composed yourself, if you want
your own page structure or only embed chiqui in *part* of a larger app (see
[Headless usage](#headless-usage)):

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

> **`<Layout>`/`<Header>`/`<Footer>` (and every other `@mrmx/chiqui/components` export) render
> unstyled — broken-looking — until you load CSS for them.** They're built on fixed DaisyUI
> class names (`navbar`, `btn`, `dropdown`, ...); nothing here works without DaisyUI's CSS
> present. See [Styling `@mrmx/chiqui/components`](#styling-mrmxchiquicomponents) below for the
> two ways to get it — a zero-config stylesheet import, or your own Tailwind + DaisyUI setup.

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

A single dynamic route serves every page — `src/routes/[[lang]]/[...slug]/+page.ts` loads the
matching entry (`entries()` here is also what step 7's `adapter-static` build reads to know
which `lang`/`slug` combinations to prerender):

```ts
// src/routes/[[lang]]/[...slug]/+page.ts
import { error } from '@sveltejs/kit';
import { getContent, contentEntries } from '$lib/content';
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

	const entry = getContent(lang, slug);
	if (!entry) throw error(404, 'Not found');

	return { lang, slug, metadata: entry.metadata, component: entry.component };
}
```

```svelte
<!-- src/routes/[[lang]]/[...slug]/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import { Seo } from '@mrmx/chiqui/components';
	import { getHreflangAlternates } from '$lib/content';

	let { data }: PageProps = $props();
	let metadata = $derived(data.metadata);
	let Page = $derived(data.component);
</script>

<Seo
	lang={data.lang}
	slug={data.slug}
	title={metadata?.title}
	description={metadata?.description}
	image={metadata?.image}
	{getHreflangAlternates}
/>

{#if metadata?.title}
	<h1>{metadata.title}</h1>
{/if}

<Page />
```

`entry.component` is the Markdown file compiled to a Svelte component by mdsvex (wired in by
`createSvelteConfig`/`createChiquiPreprocessor` — see step 7) — rendering `<Page />` is what
actually puts your Markdown's HTML on the page, inside `<Layout>`'s `<main>` from step 4.

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
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(adapter, vitePreprocess);
```

`mdsvex` itself doesn't need installing or importing — chiqui *is* an mdsvex content pipeline
(see Features above), so it's a real dependency of `@mrmx/chiqui` and `createSvelteConfig`
wires it in for you. Pass `mdsvexOptions` to override its defaults (a layout wrapper,
remark/rehype plugins, custom `extensions`):

```js
export default createSvelteConfig(adapter, vitePreprocess, {
	mdsvexOptions: { extensions: ['.md'], layout: { _: './src/lib/DocArticle.svelte' } }
});
```

For anything `aliases`/`mdsvexOptions` don't cover (extra `kit.*` fields, a fully custom
`preprocess` pipeline instead of mdsvex, custom `extensions`), pass `overrides` — merged over
the generated config last (`kit.alias` merges, everything else replaces outright):

```js
export default createSvelteConfig(adapter, vitePreprocess, {
	overrides: { kit: { env: { publicPrefix: 'PUBLIC_' } } }
});
```

**A site where chiqui only powers one section, not the whole app**, shouldn't reach for
`createSvelteConfig` at all — it makes the *entire* app's SvelteKit config depend on chiqui's
opinion of `kit.adapter`/`kit.alias`/`extensions`, for the sake of one section. Use
`createChiquiPreprocessor` instead, and keep owning `svelte.config.js` yourself:

```js
// svelte.config.js — an app chiqui doesn't own; only /docs uses it
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createChiquiPreprocessor } from '@mrmx/chiqui/svelte-config';

export default {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		createChiquiPreprocessor({ extensions: ['.md'], layout: { _: './src/lib/docs/DocArticle.svelte' } })
	],
	kit: { adapter: adapter(), alias: { $lib: './src/lib' /* ...your own aliases */ } }
};
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

## Styling `@mrmx/chiqui/components`

`Header`, `Footer`, `NavLink`, `LanguageSelect`, `LightDarkMode`, and the content components
(`Gallery`, `SpecsTable`, `CtaBand`, `ContactForm`) all render with fixed DaisyUI class names
(`navbar`, `menu`, `btn`, `dropdown`, `footer-title`, ...) — they are not usable without
DaisyUI's CSS loaded, full stop. There's no config flag that swaps this out; if you import
`@mrmx/chiqui/components` and see unstyled/broken-looking markup, this is why. Two ways to
fix it:

**Option A — `@mrmx/chiqui/style.css`, zero config.** Chiqui compiles its own DaisyUI +
Tailwind build (scanned only against its own component sources — a closed, fixed set of
classes) and publishes the result as a plain stylesheet. This is what `sites/docs` does:

```ts
// src/routes/+layout.svelte, or wherever your global CSS is imported
import '@mrmx/chiqui/style.css';
```

No Tailwind, no DaisyUI, nothing to install or configure on your side. It also includes
`@tailwindcss/typography`'s `prose`/`prose-neutral`/`dark:prose-invert`/`max-w-none` (a fixed,
pre-registered set via `@source inline()` — see `packages/chiqui/src/style.css`), so wrapping
your Markdown content in those classes gets real heading/paragraph/list/code/image typography
without your own Tailwind build either:

```svelte
<div class="content prose prose-neutral dark:prose-invert max-w-none">
	{@render children?.()}
</div>
```

The trade-off: this stylesheet only covers what chiqui's own components use, plus that fixed
prose class list — it does **not** extend to arbitrary DaisyUI/Tailwind classes you write
yourself elsewhere (e.g. `<a class="btn btn-primary">` inside your own `.md` content, as in
the [Get in touch](#get-in-touch) example above — that one happens to work only because
`btn`/`btn-primary` are already used by other chiqui components, not because Option A
generates classes on demand), nor to a `prose` variant/modifier outside that fixed list (e.g.
`prose-sm`, `prose-a:text-blue-500`). If you want either of those, use Option B instead.

**Option B — your own Tailwind + DaisyUI.** Full JIT compilation across your whole project
(so any DaisyUI/Tailwind class you write anywhere — your own components, your own Markdown
content — gets picked up too, not just chiqui's fixed set):

```css
/* src/app.css */
@import 'tailwindcss';
@source '../../../packages/chiqui/src';
@source '../../../packages/chiqui/dist';
@plugin '@tailwindcss/typography';
@plugin 'daisyui' {
	themes:
		light --default,
		dark;
}
```

The `@source` lines matter: without them, Tailwind never scans chiqui's component sources,
so classes chiqui uses internally (but your own code never types out literally) get purged
as "unused". Don't load Option A's `style.css` *and* set up Option B in the same app — you'd
ship DaisyUI's CSS twice.

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

(the full `+page.svelte` — `data.component`, `<Page />`, everything else on the page — is in
[Quick Start step 5](#5-content).)

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
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(() => adapter({ fallback: '404.html', strict: false }), vitePreprocess);
```

Hosts like Vercel/Netlify then serve `404.html` (which renders your `+error.svelte`) for any
unmatched static path. `strict: false` is required alongside `fallback` because it changes
adapter-static's all-routes-must-be-prerendered check. Chiqui's own docs site does not enable
this by default, so verify the interaction with `strict` for your own routes before shipping it.

## Content components

Four generic, DaisyUI-styled components for product/marketing content, meant to be dropped
directly inside a `.md` file via mdsvex (not just `.svelte` files) — see the recipe at the end
of this section. None of them carry any product- or brand-specific copy; all text comes in
through props.

### `<Gallery>`

- `items: Array<{ src: string; alt: string; caption?: string }>`
- Renders a responsive grid. Each item is shown as `<video autoplay muted loop playsinline
preload="metadata">` when `src` ends in `.mp4`/`.webm` (query strings/hash fragments are
  ignored, so `clip.mp4?v=2` still counts), otherwise `<img loading="lazy">`. The detection
  itself is a pure, exported function — `isVideoSrc(src)` from `@mrmx/chiqui` internals
  (`src/lib/media.ts`) — unit-tested directly (`tests/media.test.ts`) since this package has
  no component-render test harness (same rationale as `<Seo>`'s `src/lib/seo.ts`).

### `<SpecsTable>`

- `specs: Array<{ label: string; value: string }>`
- Renders a DaisyUI `table`. The framework has no opinion on language — resolve `label` (and
  `value`, if it needs translating) to the current locale before passing the array in.

### `<CtaBand>`

- `title: string`, `subtitle?: string`, and a `children` snippet for the call-to-action
  buttons (Svelte 5's `{#snippet}`/`{@render}`, not a slot).
- Renders a centered closing band; put `<a class="btn ...">` elements in `children`.

### `<ContactForm>`

- `endpoint?: string` — defaults to the Web3Forms submit endpoint
  (`https://api.web3forms.com/submit`); pass your own for a different backend that accepts the
  same `FormData` shape.
- `accessKey?: string` — a Web3Forms (or compatible) public access key. **If omitted or
  blank, the form does not send anything** — submit shows `labels.notConnected` instead. This
  is deliberate clean degradation for a site that hasn't wired up a real key yet.
- `subject?: string` — optional hidden `subject` field value.
- `labels?: Partial<ContactFormLabels>` — every piece of copy (`title?`, `subtitle?`, `name`,
  `email`, `message`, `send`, `sending`, `success`, `error`, `notConnected`), merged over
  English defaults (`defaultContactFormLabels`). The framework imposes no i18n scheme on the
  form; pass your own resolved strings per language.
- Fields: `name`, `email`, `message`, plus a hidden honeypot checkbox (`botcheck`) — if a bot
  fills it, submit is silently short-circuited to the success state without calling `fetch`.
  On submit it `POST`s a `FormData` (built by the pure, testable `buildContactFormData()` in
  `src/lib/contact-form.ts`) with `Accept: application/json`, tracks
  `idle`/`sending`/`success`/`error`/`not-connected` state, disables the submit button while
  `sending`, and calls `form.reset()` on success. The status message is
  `role="status" aria-live="polite"` so screen readers announce it. `resolveSubmitStatus(ok,
data)` (also in `src/lib/contact-form.ts`) is the pure function that turns the fetch
  response into `'success' | 'error'` — see `tests/contact-form.test.ts`.

### The mdsvex recipe

Content components are designed to be imported and used **inside a `.md` file**, in a
top-level `<script>` block — mdsvex compiles markdown to a Svelte component, so a `<script>`
block in a `.md` file behaves exactly like one in a `.svelte` file, and any capitalized tag in
the body (e.g. `<Gallery ...>`) is treated as a component reference, not literal text:

```md
---
id: components
title: Content Components
description: Product content components, demoed live.
---

<script>
	import { Gallery, SpecsTable, CtaBand, ContactForm } from '@mrmx/chiqui/components';

	const items = [
		{ src: '/img/product-front.jpg', alt: 'Product, front view' },
		{ src: '/media/demo.mp4', alt: 'Product demo clip' }
	];

	const specs = [
		{ label: 'Weight', value: '120 g' },
		{ label: 'Battery', value: '2000 mAh' }
	];
</script>

## Gallery

<Gallery {items} />

## Specs

<SpecsTable {specs} />

## Get in touch

<CtaBand title="Ready to order?" subtitle="Reach out and we'll get back to you.">
	{#snippet children()}
		<a class="btn btn-primary" href="/en/contact">Contact us</a>
	{/snippet}
</CtaBand>

<ContactForm accessKey="YOUR_WEB3FORMS_KEY" subject="New inquiry" />
```

Data (`items`, `specs`) lives inline in the `<script>` block rather than frontmatter, since
frontmatter is plain YAML (strings/numbers/booleans) — it has no way to express arrays of
objects cleanly, and mdsvex already gives every `.md` file a real Svelte `<script>` context for
free. Frontmatter stays reserved for what it's good at: `id`, `title`, `description`, and other
flat metadata consumed outside the component tree (`<Seo>`, navigation, `sitemap.xml`). See
[`sites/docs/content/en/components.md`](https://github.com/mrmx/Chiqui/tree/main/sites/docs/content/en/components.md)
(and its `es/componentes.md` translation) for the full working demo that this snippet is
based on — it renders both an image and a video `<Gallery>` item, `<SpecsTable>`, `<CtaBand>`,
and an unconnected `<ContactForm>` in the actual static build.

## Headless usage

Chiqui doesn't have to own the whole site. `@mrmx/chiqui/content`, `/navigation`, and
`/config` are plain TypeScript with no import from `/components` (the DaisyUI-based UI
layer) and no assumption about how — or whether — the consumer prerenders. This is the
shape to reach for when embedding a Markdown-driven doc section inside a larger app that
already has its own header/footer, its own i18n, and possibly server-rendered routes
elsewhere:

```ts
// src/lib/docs/content.ts — inside a larger, non-static SvelteKit app
import { createContent } from '@mrmx/chiqui/content';

// Glob path is relative to this file, not the project root, so basePath matches it.
const modules = import.meta.glob('./content/*/*.md', { eager: true });

export const docs = createContent(modules, { basePath: './content/' });
```

For a flat, sidebar-and-pager doc section specifically (the shape above tends toward),
`createDocsSection` collapses `createContent` + `assertValidIndex` + `createDocsNav` into one
call — the one-liner setup for the common case where nothing in between needs customizing:

```ts
import { createDocsSection } from '@mrmx/chiqui/navigation';

const modules = import.meta.glob('./content/*/*.md', { eager: true });
export const docs = createDocsSection(modules, { basePath: './content/', defaultLang: 'en' });

// docs.navFor('es')                  → sidebar entries, translated where available
// docs.resolve('es', 'laboratory')   → the doc (falls back to 'en', flagged `untranslated`)
// docs.neighbors('en', 'laboratory') → { previous, next } for an in-page pager
// docs.store                         → the underlying ContentStore, for anything DocsNav doesn't cover
```

Reach for `createContent` + `createDocsNav` separately instead (as above) when something needs
to happen in between — e.g. inspecting `store.index.warnings` before deciding whether to treat
them as fatal, or building more than one `DocsNav` view (a `filter`ed subset alongside the full
set) off the same store without re-parsing the glob twice.

Notes for this mode:

- **`basePath`** (`CreateContentOptions`, default `'/content/'`) must match whatever glob
  pattern you passed to `import.meta.glob` — it's the prefix `createContent` strips before
  splitting each path into `{ lang, slug }`. Use `'./content/'` for a relative glob run from
  a nested file (as above); keep the default for the conventional root-level `content/`
  layout.
- **`id` is optional** in frontmatter as of this version: if omitted, it defaults to the
  entry's own slug. This is enough for sites where the same slug is reused verbatim across
  languages (`en/getting-started.md` / `es/getting-started.md`) — the slug itself is the
  cross-language key. Sites that translate the slug too (`en/about.md` / `es/acerca.md`)
  still need an explicit `id:` in frontmatter to link the pair; `assertValidIndex()` will
  flag it (`[E:id]`) if the id ends up empty (only possible when both the slug and the id
  are missing, e.g. an untitled index page).
- **Rendering mode is still entirely up to you.** Nothing in `createContent`/`getContent`
  requires `prerender = true` or `adapter-static` — call it from a normal (dynamic) `load`
  function exactly like any other data source, or prerender the section if you want static
  output for those routes specifically. `contentEntries()` is only relevant if you opt into
  prerendering.
- **Bring your own UI.** `getContent(lang, slug)` returns a `ContentEntry` with `.component`
  (the compiled MDsveX component) and `.metadata` (frontmatter) — render it inside whatever
  layout/sidebar/pager component your app already has. `@mrmx/chiqui/components`'s `<Seo>`
  has no DaisyUI classes either (it only renders into `<svelte:head>`) and can be reused
  standalone if useful; `Header`/`Footer`/`NavLink`/`LanguageSelect` are DaisyUI-styled and
  are meant for full-site consumers, not headless ones.

## Package Exports

- `@mrmx/chiqui` — types (`AppConfig`, `Link`, `Group`, `NavNode`, `ContentEntry`, `NavItem`)
- `@mrmx/chiqui/config` — `initConfig`, `siteName`, `navItems`, `defaultLang`, etc.
- `@mrmx/chiqui/content` — `createContent` factory (exposes `contentEntries()` for
  `entries()` in prerendered dynamic routes, `getContent()` for an O(1) indexed lookup,
  `assertValidIndex()` for strict build-time validation, plus the legacy `contentRoutes`
  array). Accepts a `{ basePath? }` option for non-root content layouts — see
  [Headless usage](#headless-usage).
- `@mrmx/chiqui/components` — `Header`, `Footer`, `Hero`, `Carousel`, `LanguageSelect`, `LightDarkMode`, `Icon`, `NavLink`, `Seo`, `SiteLogo`, `Gallery`, `SpecsTable`, `CtaBand`, `ContactForm`
  - Needs DaisyUI's CSS to render correctly — see [Styling `@mrmx/chiqui/components`](#styling-mrmxchiquicomponents).
  - `Header` renders `Group` nav nodes as a DaisyUI dropdown submenu (`<details>` inside
    `menu menu-horizontal`), not just flat `Link`s.
  - `Seo` renders per-page `<title>`, canonical, hreflang (+ `x-default`), OG, and Twitter
    card tags — see the SEO section above.
  - `Gallery`, `SpecsTable`, `CtaBand`, `ContactForm` — generic rich-content components meant
    to be used inside `.md` files via mdsvex — see the Content components section above.
- `@mrmx/chiqui/navigation` — `getLevelContentEntries()` (returns `NavItem[]`, see Breaking
  Changes below), `PartialSlugOptions`, `NavItem`; `createDocsNav(store, { defaultLang, filter? })`
  for a flat, ordered doc set — sidebar (`navFor`), single-doc resolution with translation
  fallback (`resolve`), and a prev/next pager (`neighbors`), all sorted by `order` frontmatter;
  `createDocsSection(modules, { basePath?, defaultLang, filter?, strict? })` — one call from
  glob modules straight to a ready `DocsNav` (+ `.store`), wiring `createContent` +
  `assertValidIndex`/`validateIndex` + `createDocsNav` for the common case. Headless-friendly:
  built on `ContentStore` alone, no `components` import.
- `@mrmx/chiqui/hooks` — `createLangHandle()` for `hooks.server.ts` (rewrites the `%lang%`
  placeholder in `app.html`), plus the pure `resolveLangFromPath()` it's built on
- `@mrmx/chiqui/sitemap` — `generateSitemapXml()` for a prerendered `sitemap.xml/+server.ts`
- `@mrmx/chiqui/vite` — `chiquiViteConfig()` for `vite.config.ts` (deep-merges `options.vite`
  via Vite's own `mergeConfig` instead of a shallow spread)
- `@mrmx/chiqui/svelte-config` — `createSvelteConfig()` for a whole `svelte.config.js`, fully
  typed (`Adapter`, `Config` from `@sveltejs/kit`; no `any` in its public signature), with an
  `overrides` escape hatch merged over its output last; `createChiquiPreprocessor()` for just
  the mdsvex preprocessor, when a consumer owns `svelte.config.js` itself (e.g. chiqui powers
  one section of a larger app) and only wants to avoid depending on `mdsvex` directly
- `@mrmx/chiqui/style.css` — compiled DaisyUI + Tailwind CSS for `@mrmx/chiqui/components`,
  plus `@tailwindcss/typography`'s `prose`/`prose-neutral`/`dark:prose-invert`/`max-w-none`
  for Markdown content, zero config needed on the consumer's side — see
  [Styling `@mrmx/chiqui/components`](#styling-mrmxchiquicomponents)
- `@mrmx/chiqui/types` — bare types entry point

## Breaking Changes

Summary below; see [CHANGELOG.md](https://github.com/mrmx/Chiqui/blob/main/packages/chiqui/CHANGELOG.md) for the complete, generated history.

- **0.2.0**
  - `getLevelContentEntries()` now returns `NavItem[]` (`{ lang, slug, title }`) instead of a
    fabricated `ContentEntry[]` that lacked a real `component`/`metadata.id`. If you called
    `.component` or `.metadata` on its results, update to the flat `.title` field instead.
  - `createSvelteConfig(adapter, vitePreprocess, mdsvex, options?)` drops the `mdsvex`
    parameter — it's a real dependency of `@mrmx/chiqui` now, wired in internally. Update
    call sites to `createSvelteConfig(adapter, vitePreprocess, options?)`; override mdsvex
    options via `options.mdsvexOptions`.
  - `createSvelteConfig`'s default `extensions` is now `['.svelte', ...mdsvexExtensions]`
    (`['.svelte', '.md']` by default) instead of the previous hardcoded
    `['.svelte', '.svx', '.md']`. A site relying on default `.svx` support must now pass
    `mdsvexOptions: { extensions: ['.md', '.svx'] }` explicitly.

## Working Example

- [`sites/docs`](https://github.com/mrmx/Chiqui/tree/main/sites/docs) — the full/Quick Start
  pattern: chiqui owns the whole site (routing, i18n, `<Header>`/`<Footer>`, static
  generation).
- [`sites/headless-demo`](https://github.com/mrmx/Chiqui/tree/main/sites/headless-demo) — the
  headless pattern: a minimal, otherwise-plain SvelteKit app (own layout, own routes,
  `adapter-auto`, no `@mrmx/chiqui/components`) that embeds only `createDocsSection` +
  `createChiquiPreprocessor` for a `/docs` section — see the "Headless usage" section above.

## License

[MIT](https://github.com/mrmx/Chiqui/blob/main/LICENSE) — Copyright © mrmx
