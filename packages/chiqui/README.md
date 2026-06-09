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
	getContent,
	getTranslatedSlug,
	getHreflangAlternates,
	contentRoutes
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

## Package Exports

- `@mrmx/chiqui` — types (`AppConfig`, `Link`, `Group`, `NavNode`, `ContentEntry`)
- `@mrmx/chiqui/config` — `initConfig`, `siteName`, `navItems`, `defaultLang`, etc.
- `@mrmx/chiqui/content` — `createContent` factory
- `@mrmx/chiqui/components` — `Header`, `Footer`, `Hero`, `Carousel`, `LanguageSelect`, `LightDarkMode`, `Icon`, `NavLink`, `SiteLogo`
- `@mrmx/chiqui/navigation` — navigation helpers
- `@mrmx/chiqui/vite` — `chiquiViteConfig()` for `vite.config.ts`
- `@mrmx/chiqui/svelte-config` — `createSvelteConfig()` for `svelte.config.js`
- `@mrmx/chiqui/types` — bare types entry point

## Working Example

See [`sites/docs`](https://github.com/mrmx/Chiqui/tree/main/sites/docs) in the repo for a complete reference site.

## License

[MIT](https://github.com/mrmx/Chiqui/blob/main/LICENSE) — Copyright © mrmx
