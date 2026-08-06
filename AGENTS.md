# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Chiqui is an open-source, content-driven SSG framework built on SvelteKit + mdsvex. This is a pnpm monorepo. The npm package is published as `@mrmx/chiqui`.

## Structure

```
packages/chiqui/    # The npm package (@mrmx/chiqui) — lib (types, config, content, navigation) + Svelte components
sites/docs/         # Documentation site that dogfoods @mrmx/chiqui as a dependency (full/Quick Start pattern — chiqui owns the whole site)
sites/headless-demo/ # Minimal reference for the headless pattern — own layout/routes/adapter-auto, only createDocsSection + createChiquiPreprocessor from chiqui
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
- **`createContent(modules, options?)`** — factory that takes `import.meta.glob` result from the consumer (Vite glob must run in consumer context). `getContent(lang, slug)` is an O(1) lookup against `index.bySlug` (not a linear `Array.find`). `options.basePath` (default `'/content/'`) is the prefix stripped before splitting each glob key into `{ lang, slug }` — set it to match a non-root glob (e.g. `'./content/'` for a relative glob run from a nested lib file), which is the seam a consumer embedding just the content engine inside a larger app uses (see README "Headless usage"). Frontmatter `id` is optional: when omitted it defaults to the entry's own slug, so translations that already reuse the same slug across languages link up without redundant `id:` frontmatter — sites that translate the slug too (`about`/`acerca`) still need an explicit `id` to link the pair.
- **`createSvelteConfig(adapter, vitePreprocess, options?)`** — generates standard SvelteKit config; fully typed (`adapter: () => Adapter`, return type `Config` from `@sveltejs/kit`), no `any` in its signature. `mdsvex` is not a parameter — it's a real dependency of `@mrmx/chiqui` (chiqui *is* an mdsvex content pipeline), imported and applied internally; override its options via `options.mdsvexOptions`, or anything else via `options.overrides` (merged over the generated config last — `kit.alias` merges, everything else replaces outright). `createChiquiPreprocessor(mdsvexOptions?)` is the narrower sibling — just the mdsvex preprocessor, for a consumer that owns its own `svelte.config.js` (e.g. chiqui powers one section of a larger, otherwise-dynamic app) and doesn't want `createSvelteConfig`'s full opinion on `kit.adapter`/`kit.alias`/`extensions`.
- **`chiquiViteConfig()`** — returns Vite config with test/coverage defaults; merges `options.vite` with Vite's own `mergeConfig` (deep merge) instead of a shallow `...spread`, so nested keys like `server.fs.allow` survive a caller passing e.g. `vite: { server: {...} }`
- **`getLevelContentEntries()`** (in `@mrmx/chiqui/navigation`) returns `NavItem[]` (`{ lang, slug, title }`), a dedicated synthetic-nav-node type — not a fabricated `ContentEntry` (which would lie about having a real `component`/`metadata.id`)
- **`createDocsNav(store, { defaultLang, filter? })`** (also in `@mrmx/chiqui/navigation`) — the headless building block for a flat `/docs`-style section: `navFor(lang)` (sidebar, sorted by `order` frontmatter then title, translated where available), `resolve(lang, slug)` (single doc, falling back to `defaultLang` and flagged `untranslated` instead of 404ing), `neighbors(lang, slug)` (prev/next pager). Built only on `ContentStore` (from `createContent`), so it composes with the headless/`basePath` pattern above with no `components` dependency. Deliberately narrower than `getLevelContentEntries` (flat doc list vs. hierarchical nav-tree from slug segments) — pick based on shape, not as a default.
- **`createDocsSection(modules, { basePath?, defaultLang, filter?, strict? })`** (also in `@mrmx/chiqui/navigation`) — one-call convenience wrapper: `createContent` → `assertValidIndex()`/`validateIndex()` (`strict`, default `true`) → `createDocsNav`, returning `DocsNav & { store }`. This is the one to reach for from a consumer's own glob-wiring file when nothing needs to happen between the three steps; drop to the separate calls when it does (e.g. inspecting `store.index.warnings` before deciding severity, or building more than one filtered `DocsNav` off one store).
- Components use `$lib/` imports internally (resolved by svelte-package during build). `Header` renders `Group` nav nodes as a DaisyUI dropdown submenu (`<details>` inside `menu menu-horizontal`, recursive for nested groups) instead of silently dropping them; it uses `$app/state` (not the deprecated `$app/stores`), consistent with `LanguageSelect`.
- **`@mrmx/chiqui/components` needs DaisyUI's CSS to not render broken** — its class names (`navbar`, `btn`, `dropdown`, `footer-title`, ...) are fixed, not swappable. `src/style.css` (scanned only against `src/lib/components/**`, a closed set of classes, plus `@tailwindcss/typography`'s `prose`/`prose-neutral`/`dark:prose-invert`/`max-w-none` force-included via `@source inline()` as a Layout-independent guarantee — `Layout.svelte` already writes those literally too) is chiqui's own build input, compiled by `pnpm build:css` (`tailwindcss -i src/style.css -o dist/style.css --minify`, part of `pnpm build`) into `dist/style.css`, published as the `@mrmx/chiqui/style.css` export — a zero-config drop-in for a consumer that uses the components as-is, including Markdown content typography (`<Layout>`'s `<main>` wraps content in `prose prose-neutral dark:prose-invert` + `max-w-none lg:max-w-5xl`, all in its own component markup — see `sites/docs`, which composes nothing of its own). A consumer that also authors its own arbitrary DaisyUI classes or `prose` modifiers outside that fixed list needs full Tailwind + DaisyUI of its own instead (with `@source` pointing at chiqui's `src`/`dist`) — don't load both, it ships DaisyUI's CSS twice. See the README's "Styling `@mrmx/chiqui/components`" section.
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
6. `src/routes/+layout.svelte` is just `<Layout>{@render children?.()}</Layout>` from `@mrmx/chiqui/components` — the whole page shell (`<Header>`/`<main>`/`<Footer>`), zero markup or CSS of the site's own

### Static generation (prerender)

Chiqui sites are genuinely static: `sites/docs` uses `@sveltejs/adapter-static` (not
`adapter-auto`), configured via `createSvelteConfig(adapter, vitePreprocess)` in
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
