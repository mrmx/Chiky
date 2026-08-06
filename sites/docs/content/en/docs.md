---
id: docs
title: Documentation
description: Get started with Chiqui — install the package, write your config, add Markdown content, and wire up your SvelteKit site.
---

## Getting Started

This page is the full install, end to end — the same one this site itself follows (see its
[source](https://github.com/mrmx/Chiqui/tree/main/sites/docs)). It builds up to this file
layout:

```txt
my-site/
├── config.ts                              # 2. site/i18n/nav config
├── content/
│   ├── en/index.md                        # 6. Markdown content, one tree per language
│   └── es/index.md
├── static/
│   └── robots.txt
├── src/
│   ├── app.html                           # %lang% placeholder for createLangHandle()
│   ├── hooks.server.ts                    # 7. assertValidIndex() + createLangHandle()
│   ├── lib/
│   │   ├── config.ts                      # 3. initConfig() + re-exports
│   │   └── content.ts                     # 4. createContent()
│   └── routes/
│       ├── +layout.ts                     # 8. export const prerender = true
│       ├── +layout.svelte                 # 5. <Layout>
│       └── [[lang]]/[...slug]/
│           ├── +page.ts                   # 6. load() + entries()
│           └── +page.svelte               # 6. <Seo> + the loaded content component
├── svelte.config.js                       # 8. createSvelteConfig()
└── vite.config.ts                         # chiquiViteConfig()
```

### 1. Create a new site

```bash
mkdir my-site && cd my-site
pnpm init
pnpm add @mrmx/chiqui
pnpm add -D @sveltejs/adapter-static
```

### 2. Root `config.ts`

Site metadata, supported languages, and navigation — the single source every helper below
reads from:

```ts
import type { AppConfig } from '@mrmx/chiqui';

const config: AppConfig = {
	site: {
		name: 'My Site',
		logoUrl: '/img/logo.svg',
		url: 'https://example.com'
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

### 3. `src/lib/config.ts`

Initializes that config once and re-exports chiqui's config helpers (`siteName`,
`defaultLang`, `showFooter`, ...) for the rest of the app to import from one place:

```ts
import rawConfig from '../../config';
import { initConfig } from '@mrmx/chiqui/config';

initConfig(rawConfig, { validate: true });

export * from '@mrmx/chiqui/config';
```

### 4. `src/lib/content.ts`

Builds the content store from every `.md` file under `content/`:

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

### 5. Layout

`src/routes/+layout.svelte` — `<Layout>` is the whole page shell: `<Header>` on top, a
scrollable `<main>` wrapped in `prose` for your Markdown, `<Footer>` pinned to the bottom.
Zero other markup or CSS needed:

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

`<Layout>` (like every `@mrmx/chiqui/components` export) is built on fixed DaisyUI class
names — nothing renders correctly until `@mrmx/chiqui/style.css` is imported somewhere, as
above.

### 6. Content + the page route

Markdown files live in `content/{lang}/{slug}.md` with frontmatter:

```md
---
id: home
title: Welcome
---

Hello world.
```

The `id` is the canonical identifier — use the same `id` across languages to link
translations (`content/en/about.md` and `content/es/acerca.md` both with `id: about`).
Routes come from language + slug: `content/en/about.md` → `/en/about`, `content/en/index.md`
→ `/en`.

One dynamic route serves every page:

```ts
// src/routes/[[lang]]/[...slug]/+page.ts
import { error } from '@sveltejs/kit';
import { getContent, contentEntries } from '$lib/content';
import { defaultLang } from '$lib/config';

export function entries() {
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

`entry.component` is the `.md` file compiled to a Svelte component by mdsvex — rendering
`<Page />` puts your Markdown's HTML inside `<Layout>`'s `<main>` from step 5.

### 7. Validate content at build time

Wire `assertValidIndex()` into `src/hooks.server.ts`'s `init` hook so a build with broken
content (duplicate ids, missing frontmatter, ...) fails loudly instead of shipping silently:

```ts
// src/hooks.server.ts
import type { ServerInit } from '@sveltejs/kit';
import { assertValidIndex } from '$lib/content';

export const init: ServerInit = async () => {
	assertValidIndex();
};
```

### 8. Static generation

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(adapter, vitePreprocess);
```

`mdsvex` doesn't need installing or importing yourself — `createSvelteConfig` wires it in.
Opt every route into prerendering:

```ts
// src/routes/+layout.ts
export const prerender = true;
```

`pnpm build` then emits a fully static `build/` directory (`index.html`, `en.html`,
`en/about.html`, `es/acerca.html`, ...) ready for any static host.

For the full package API — SEO helpers, `<Gallery>`/`<SpecsTable>`/`<CtaBand>`/`<ContactForm>`,
headless usage, styling options — see the
[package README](https://github.com/mrmx/Chiqui/tree/main/packages/chiqui#readme).
