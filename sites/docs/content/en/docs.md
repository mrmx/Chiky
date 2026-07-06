---
id: docs
title: Documentation
description: Get started with Chiqui — install the package, write your config, add Markdown content, and wire up your SvelteKit site.
---

## Getting Started

### 1. Create a new site

```bash
mkdir my-site && cd my-site
pnpm init
pnpm add @mrmx/chiqui
```

### 2. Add your config

Create `config.ts` at the root of your project:

```ts
import type { AppConfig } from '@mrmx/chiqui';

const config: AppConfig = {
	site: { name: 'My Site' },
	i18n: { defaultLang: 'en', supported: ['en'] },
	nav: {
		header: { show: true, items: { en: [{ name: 'Home', href: '/en' }] } },
		footer: { show: true, items: { en: [] } }
	}
};

export default config;
```

### 3. Write content

Create markdown files in `content/{lang}/`:

```md
---
id: home
title: Welcome
---

Hello world!
```

### 4. Wire up chiqui

Create the thin integration layer in `src/lib/config.ts` and `src/lib/content.ts`, then use chiqui components in your layout.

See the [docs site source](https://github.com/mrmx/Chiqui) for a complete working example.
