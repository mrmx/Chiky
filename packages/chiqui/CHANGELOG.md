# @mrmx/chiqui

## 0.2.0

### Minor Changes

- Headless content engine, zero-config component styling, and a new `<Layout>` component.

  **Breaking:** `createSvelteConfig(adapter, vitePreprocess, mdsvex, options?)` drops the
  `mdsvex` parameter — it's now a real dependency of `@mrmx/chiqui`, wired in internally.
  Update call sites to `createSvelteConfig(adapter, vitePreprocess, options?)`. Override mdsvex
  options via `options.mdsvexOptions`, anything else via `options.overrides`.

  **Breaking:** `createSvelteConfig`'s default `extensions` is now `['.svelte', ...mdsvexExtensions]`
  (mdsvex's own `extensions`, defaulting to `['.md']`) instead of the previous hardcoded
  `['.svelte', '.svx', '.md']`. A site relying on the default `.svx` support must now pass
  `mdsvexOptions: { extensions: ['.md', '.svx'] }` explicitly.

  New:
  - `createContent(modules, options?)` — `options.basePath` overrides the default `/content/`
    prefix, for a consumer embedding chiqui's content engine in a nested lib file (a relative
    glob, not a root one). Frontmatter `id` is now optional, defaulting to the entry's own slug.
  - `createChiquiPreprocessor(mdsvexOptions?)` — just the mdsvex preprocessor, for a consumer
    that owns its own `svelte.config.js` and only wants chiqui for one section of a larger app.
  - `createDocsNav`/`createDocsSection` (`@mrmx/chiqui/navigation`) — headless building blocks
    for a flat `/docs`-style section: sidebar nav, single-doc resolution with `defaultLang`
    fallback, and a prev/next pager. Built only on `ContentStore`, no `components` dependency.
  - `<Layout>` component — the full zero-config page shell (`<Header>`/`<main>`/`<Footer>`,
    sticky-footer flex layout, `prose` wrapper for Markdown content).
  - `@mrmx/chiqui/style.css` — a precompiled DaisyUI/Tailwind stylesheet scanned against
    chiqui's own component sources, for a consumer that wants to use
    `@mrmx/chiqui/components` without installing/configuring Tailwind + DaisyUI itself.
  - `sites/headless-demo` — reference site demonstrating the headless pattern end to end.
