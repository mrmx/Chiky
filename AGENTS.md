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

Exports via subpath exports (`@mrmx/chiqui`, `@mrmx/chiqui/config`, `@mrmx/chiqui/content`, `@mrmx/chiqui/components`, `@mrmx/chiqui/navigation`, `@mrmx/chiqui/hooks`, `@mrmx/chiqui/sitemap`, `@mrmx/chiqui/vite`, `@mrmx/chiqui/svelte-config`).

Key design decisions:

- **`initConfig(rawConfig)`** — consumer provides their AppConfig, chiqui caches and exposes helpers (siteName, navItems, etc.)
- **`createContent(modules)`** — factory that takes `import.meta.glob` result from the consumer (Vite glob must run in consumer context). `getContent(lang, slug)` is an O(1) lookup against `index.bySlug` (not a linear `Array.find`).
- **`createSvelteConfig(adapter, vitePreprocess, mdsvex)`** — generates standard SvelteKit config; fully typed (`adapter: () => Adapter`, return type `Config` from `@sveltejs/kit`), no `any` in its signature
- **`chiquiViteConfig()`** — returns Vite config with test/coverage defaults; merges `options.vite` with Vite's own `mergeConfig` (deep merge) instead of a shallow `...spread`, so nested keys like `server.fs.allow` survive a caller passing e.g. `vite: { server: {...} }`
- **`getLevelContentEntries()`** (in `@mrmx/chiqui/navigation`) returns `NavItem[]` (`{ lang, slug, title }`), a dedicated synthetic-nav-node type — not a fabricated `ContentEntry` (which would lie about having a real `component`/`metadata.id`)
- Components use `$lib/` imports internally (resolved by svelte-package during build). `Header` renders `Group` nav nodes as a DaisyUI dropdown submenu (`<details>` inside `menu menu-horizontal`, recursive for nested groups) instead of silently dropping them; it uses `$app/state` (not the deprecated `$app/stores`), consistent with `LanguageSelect`.
- **SEO** (`<Seo>` in `@mrmx/chiqui/components`) — per-page `<title>`, canonical, hreflang
  alternates + `x-default`, OG/Twitter tags. Takes `getHreflangAlternates` injected the same
  way `Header` takes `getTranslatedSlug`. Its pure URL-building logic (`buildCanonicalPath`,
  `buildPageTitle`, `toAbsoluteUrl`, `findDefaultAlternate`, `normalizeOrigin`) lives in
  `src/lib/seo.ts` (untested-via-render, tested directly since this package has no
  component-render test harness). `AppConfig.site.url` (+ `siteUrl()` helper) is the
  configured absolute origin, normalized (no trailing slash); falls back to `page.url.origin`.
  `<html lang>` is handled separately: `app.html` keeps a literal `%lang%` placeholder and
  `createLangHandle()` (`@mrmx/chiqui/hooks`) rewrites it per-request via
  `transformPageChunk`, since the site is fully prerendered and has no other way to
  template the root HTML document.
- **`generateSitemapXml()`** (`@mrmx/chiqui/sitemap`) builds `sitemap.xml` from a
  `ContentStore`-shaped object (`{ contents, getHreflangAlternates }` — a minimal structural
  type, not the full `ContentStore`), with `xhtml:link` hreflang alternates per entry.
  **Known quirk**: `getHreflangAlternates` templates hrefs as `${origin}/${lang}/${slug}`,
  giving a trailing slash for empty-slug/home entries (`/en/`) even though the real
  prerendered file serves `/en` (no slash). `<Seo>`'s own canonical link and
  `generateSitemapXml`'s `<loc>` avoid this by building a clean path directly
  (`buildCanonicalPath()`), but the hreflang `<link>`/`<xhtml:link>` tags themselves still
  carry it, since GOAL-05 keeps `getHreflangAlternates`'s signature/behavior untouched.
- **Content components** (`Gallery`, `SpecsTable`, `CtaBand`, `ContactForm` in
  `@mrmx/chiqui/components`) — generic, brand-free rich-content components meant to be used
  directly inside a `.md` file via mdsvex (a top-level `<script>` block in the `.md` behaves
  like one in a `.svelte` file, so components can be imported and given inline data right
  there — see `sites/docs/content/en/components.md`). `Gallery`'s video-vs-image detection
  (`isVideoSrc()`, by `.mp4`/`.webm` extension, ignoring query/hash) lives in `src/lib/media.ts`;
  `ContactForm`'s access-key/FormData/status logic (`isAccessKeyConfigured()`,
  `buildContactFormData()`, `resolveSubmitStatus()`) lives in `src/lib/contact-form.ts` — both
  pure and unit-tested directly, same rationale as `src/lib/seo.ts` (no component-render test
  harness in this package). `ContactForm` degrades cleanly (`labels.notConnected`, no request
  sent) when `accessKey` is missing/blank.

### Consumer pattern (sites/docs shows the canonical example)

1. `config.ts` (root) — site-specific AppConfig (name, logo, nav, i18n)
2. `src/lib/config.ts` — calls `initConfig(rawConfig)` and re-exports helpers
3. `src/lib/content.ts` — calls `createContent(import.meta.glob(...))` and re-exports
4. `src/hooks.server.ts` — imports config (triggers init) + calls `assertValidIndex()` in
   the `init` hook so invalid content (duplicate ids, missing frontmatter, ...) throws and
   aborts the build/prerender instead of just logging. `console.log` content dumps are
   gated behind `dev` from `$app/environment` (never printed in a production build).
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
  `en/about.html`, `es/acerca.html`, `en/components.html`, `es/componentes.html`) — 9 HTML
  files for the current content set, plus a prerendered `sitemap.xml`
  (`src/routes/sitemap.xml/+server.ts`, `export const prerender = true`, no `entries()` needed
  since it's a static route name) and a static `robots.txt` (`static/robots.txt`).
- `src/routes/+error.svelte` handles in-app errors (e.g. an unknown slug's `load()` throwing
  `error(404, ...)`), but `adapter-static` does **not** emit a `404.html` fallback by
  default — see the README's SEO section (404 page) for the `fallback`/`strict` adapter
  options pattern if a host needs one.

### Content system

- Markdown files in `content/{lang}/{slug}.md` with frontmatter `id` (canonical cross-language identifier)
- Build-time validation: unique slugs per lang, unique (id, lang) pairs. `validateIndex()`
  logs and returns `boolean` (never throws, kept for compat); `assertValidIndex()` throws
  with the accumulated error list — use this one in `hooks.server.ts` so a bad build fails.
- i18n via `getTranslatedSlug()` using canonical IDs
- `contentEntries()` derives `{ lang, slug }[]` from loaded content for use in SvelteKit's
  `entries()` (the active way to feed prerendering); `contentRoutes` (`/{lang}/{slug}` strings)
  is kept for backwards compatibility

## Stack

SvelteKit 2 + Svelte 5 (runes) + mdsvex + Tailwind CSS 4 + DaisyUI 5 + Vite 7 + TypeScript
