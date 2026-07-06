# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Chiqui is an open-source, content-driven SSG framework built on SvelteKit + mdsvex. This is a pnpm monorepo. The npm package is published as `@mrmx/chiqui`.

## Structure

```
packages/chiqui/    # The npm package (@mrmx/chiqui) — lib (types, config, content, navigation) + Svelte components
sites/docs/         # Documentation site that dogfoods @mrmx/chiqui as a dependency
```

## Commands

```bash
pnpm install                              # Install all workspace deps
pnpm --filter @mrmx/chiqui build            # Build the @mrmx/chiqui package (svelte-package → dist/)
pnpm --filter docs dev                    # Dev server for docs site
pnpm --filter docs build                  # Production build for docs site
pnpm --filter docs test                   # Run vitest for docs site
pnpm --filter docs check                  # svelte-check + TypeScript validation
pnpm build                                # Build @mrmx/chiqui package then docs site
pnpm test                                 # Run all tests across workspace
```

## Architecture

### packages/chiqui

Exports via subpath exports (`@mrmx/chiqui`, `@mrmx/chiqui/config`, `@mrmx/chiqui/content`, `@mrmx/chiqui/components`, `@mrmx/chiqui/navigation`, `@mrmx/chiqui/vite`, `@mrmx/chiqui/svelte-config`).

Key design decisions:

- **`initConfig(rawConfig)`** — consumer provides their AppConfig, chiqui caches and exposes helpers (siteName, navItems, etc.)
- **`createContent(modules)`** — factory that takes `import.meta.glob` result from the consumer (Vite glob must run in consumer context)
- **`createSvelteConfig(adapter, vitePreprocess, mdsvex)`** — generates standard SvelteKit config
- **`chiquiViteConfig()`** — returns Vite config with test/coverage defaults
- Components use `$lib/` imports internally (resolved by svelte-package during build)

### Consumer pattern (sites/docs shows the canonical example)

1. `config.ts` (root) — site-specific AppConfig (name, logo, nav, i18n)
2. `src/lib/config.ts` — calls `initConfig(rawConfig)` and re-exports helpers
3. `src/lib/content.ts` — calls `createContent(import.meta.glob(...))` and re-exports
4. `src/hooks.server.ts` — imports config (triggers init) + validates content
5. Routes import from `$lib/config` and `$lib/content` (the site's thin wrappers)
6. Layout uses `<Header />` and `<Footer />` from `@mrmx/chiqui/components`

### Static generation (prerender)

Chiqui sites are genuinely static: `sites/docs` uses `@sveltejs/adapter-static` (not
`adapter-auto`), configured via `createSvelteConfig(adapter, vitePreprocess, mdsvex)` in
`svelte.config.js`.

- `src/routes/+layout.ts` sets `export const prerender = true;` so every route is prerendered.
- The dynamic content route `src/routes/[[lang]]/[...slug]/+page.ts` exports
  `entries()`, built from `contentEntries()` (see below) plus one explicit
  `{ lang: '', slug: '' }` entry so the bare `/` root is also prerendered (it renders the
  defaultLang home page, same as `/{defaultLang}`).
- `pnpm --filter docs build` (or root `pnpm build`) emits static HTML into
  `sites/docs/build/` — one file per lang/slug combination (e.g. `index.html`, `en.html`,
  `en/about.html`, `es/acerca.html`).

### Content system

- Markdown files in `content/{lang}/{slug}.md` with frontmatter `id` (canonical cross-language identifier)
- Build-time validation: unique slugs per lang, unique (id, lang) pairs
- i18n via `getTranslatedSlug()` using canonical IDs
- `contentEntries()` derives `{ lang, slug }[]` from loaded content for use in SvelteKit's
  `entries()` (the active way to feed prerendering); `contentRoutes` (`/{lang}/{slug}` strings)
  is kept for backwards compatibility

## Stack

SvelteKit 2 + Svelte 5 (runes) + mdsvex + Tailwind CSS 4 + DaisyUI 5 + Vite 7 + TypeScript
