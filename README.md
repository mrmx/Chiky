# <img src="./sites/docs/static/img/logo.svg" alt="Chiqui logo" width="96" height="96" valign="middle" /> Chiqui

[![npm version](https://img.shields.io/npm/v/@mrmx/chiqui.svg)](https://www.npmjs.com/package/@mrmx/chiqui)
[![CI](https://github.com/mrmx/Chiqui/actions/workflows/ci.yml/badge.svg)](https://github.com/mrmx/Chiqui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Content-driven SvelteKit SSG framework with i18n, mdsvex content pipeline, and DaisyUI components.

> Looking for **how to use Chiqui in your site**? See the package readme:
> **[packages/chiqui/README.md](./packages/chiqui/README.md)** or [`@mrmx/chiqui` on npm](https://www.npmjs.com/package/@mrmx/chiqui).

This repository is a pnpm monorepo containing the published package and its docs site.

## Repository Layout

```txt
.
├── packages/
│   └── chiqui/           # Reusable Svelte package — published to npm as @mrmx/chiqui
└── sites/
    ├── docs/             # Reference docs site — full/Quick Start pattern (chiqui owns the whole site)
    └── headless-demo/    # Minimal reference for the headless pattern (chiqui powers one section of an app)
```

## Development

Requires Node (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev:docs                       # Dev server for the docs site
pnpm dev:headless-demo              # Dev server for the headless-demo site
pnpm --filter '@mrmx/chiqui' build  # Build the package
pnpm build                          # Build everything
pnpm -r check                       # svelte-check + TypeScript
pnpm -r test                        # All tests
pnpm format                         # Prettier
```

## Release

Versioning and changelogs are managed with [Changesets](https://github.com/changesets/changesets).
`sites/docs` and `sites/headless-demo` are private and excluded from versioning.

```bash
pnpm changeset          # after a change to packages/chiqui, describe it (patch/minor/major)
pnpm changeset version  # consumes pending changesets, bumps packages/chiqui/package.json, writes CHANGELOG.md
```

Commit the result, then tag and push — the `publish.yml` workflow publishes `@mrmx/chiqui` to
npm on tags `v*` (it verifies the tag matches `package.json`'s version before publishing):

```bash
git tag v$(node -p "require('./packages/chiqui/package.json').version")
git push origin --tags
```

## License

MIT — see [LICENSE](./LICENSE).
