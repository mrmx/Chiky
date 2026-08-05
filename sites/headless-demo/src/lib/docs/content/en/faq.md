---
title: FAQ
description: File-by-file — everything this site is made of, and nothing more.
order: 2
---

## Where does chiqui show up?

Two places only:

- `src/lib/docs.ts` — `createDocsSection()` from `@mrmx/chiqui/navigation`
- `svelte.config.js` — `createChiquiPreprocessor()` from `@mrmx/chiqui/svelte-config`

That's the entire dependency surface. No `@mrmx/chiqui/components`, no DaisyUI, no
`AppConfig`/`initConfig` — those exist for the *full* pattern (`sites/docs`), not this one.

## Where does everything else come from?

This app, same as any plain SvelteKit project:

| File | Owns |
|---|---|
| `src/routes/+layout.svelte` | The sidebar (reads `docs.navFor('en')`), page shell, `app.css` import |
| `src/routes/[...slug]/+page.ts` | Slug → doc resolution, the 404, defaulting `/` to `docs.defaultSlug` |
| `src/routes/[...slug]/+page.svelte` | Rendering one doc (`doc.metadata.title`, `<Doc />`) + the prev/next pager |
| `src/app.css` | All styling — plain CSS, no design system |
| `svelte.config.js` (`kit.adapter`) | `adapter-auto` — this site is served dynamically, not prerendered |

## Why is content at `src/lib/docs/content/`, not `content/` at the root?

Because `createDocsSection`'s `basePath` option matches whatever glob pattern you give it —
here that's `import.meta.glob('./docs/content/*/*.md', ...)`, run from `src/lib/docs.ts`, so
`basePath: './docs/content/'`. The root-level `content/` folder in `sites/docs` is just the
*other* pattern's convention; headless usage doesn't require it.

## Could this site use two languages, like `sites/docs` does?

Yes — `createDocsSection` already takes a `defaultLang` and falls back translations with an
`untranslated` flag; this demo just doesn't exercise it (`en` only, on purpose — see the
[Getting started](/getting-started) page for why: keeping this example minimal).
