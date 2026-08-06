// Content loading & validation utilities for chiqui SSG.
// The consumer calls createContent(modules) passing the result of
// import.meta.glob('/content/**/*.md', { eager: true }).
// This keeps Vite's glob in the consumer's context while chiqui owns the logic.
//
// Headless usage: a consumer that embeds chiqui as a section of a larger app (its own
// Header/Footer, its own i18n, content living somewhere other than a root-level
// `content/` folder) can call createContent with a `basePath` matching whatever glob
// pattern it used, e.g. `createContent(glob, { basePath: './content/' })` for
// `import.meta.glob('./content/*/*.md', ...)` run from a nested lib file. See
// @mrmx/chiqui/navigation and @mrmx/chiqui/config for the rest of the headless surface —
// none of `content`, `navigation`, or `config` import anything from `components`, so a
// consumer can use the content engine without pulling in the DaisyUI-based UI.

import type { Component } from 'svelte';
import type { ContentEntry, ContentFrontmatter, ContentIndex } from './types.js';

export interface CreateContentOptions {
	/**
	 * Prefix stripped from each glob key before parsing it into `{ lang, slug }`. Must match
	 * the glob pattern passed to `import.meta.glob` (e.g. `'/content/'` for a root-level
	 * `import.meta.glob('/content/**\/*.md', ...)`, or `'./content/'` for a relative glob run
	 * from a file living next to its own `content/` folder). Defaults to `'/content/'`, the
	 * conventional root-level layout used by `sites/docs`.
	 */
	basePath?: string;
}

// --- Parse glob modules into content entries --------------------------------

function stripBasePath(path: string, basePath: string): string {
	return path.startsWith(basePath) ? path.slice(basePath.length) : path;
}

function parseModules(modules: Record<string, any>, basePath: string): ContentEntry[] {
	return Object.entries(modules).map(([path, mod]: [string, any]) => {
		const parts = stripBasePath(path, basePath)
			.replace(/\.md$/, '')
			.replace(/\/index$/, '')
			.split('/');
		const lang = parts[0];
		const slug = parts.slice(1).join('/');

		const md = (mod?.metadata ?? {}) as Partial<ContentFrontmatter>;
		return {
			lang,
			slug,
			metadata: {
				// Falls back to the slug (not '') when frontmatter omits `id`: a consumer whose
				// translations already share the same slug across languages (e.g. `en/foo.md` and
				// `es/foo.md`) gets a working canonical id for free, instead of being forced to add
				// redundant `id:` frontmatter everywhere. Sites that use different slugs per
				// language (e.g. `en/about.md` / `es/acerca.md`) still need an explicit `id` to link
				// them — this only removes the requirement, it doesn't change its meaning.
				id: String(md.id ?? slug),
				title: md.title as string | undefined,
				...md
			},
			component: (mod as any).default as Component
		};
	});
}

// --- Build index & validate -------------------------------------------------

function slugKey(lang: string, slug: string): string {
	return `${lang}/${slug}`;
}

function buildIndex(list: ContentEntry[]): ContentIndex {
	const errors: string[] = [];
	const warnings: string[] = [];

	const bySlug: Record<string, ContentEntry> = Object.create(null);
	const byId: Record<string, Record<string, ContentEntry>> = Object.create(null);

	for (const e of list) {
		if (!e.lang || typeof e.lang !== 'string') {
			errors.push(`[E:lang] Entry with slug '${e.slug}' has invalid 'lang'.`);
		}
		if (!e.metadata?.id || typeof e.metadata.id !== 'string' || e.metadata.id.trim() === '') {
			errors.push(
				`[E:id] '${e.lang}/${e.slug}' is missing required metadata.id (canonical content id).`
			);
		}

		const routeKey = slugKey(e.lang, e.slug);
		if (bySlug[routeKey]) {
			errors.push(`[E:slug-dup] Duplicate slug '${e.slug}' for lang='${e.lang}'.`);
		} else {
			bySlug[routeKey] = e;
		}

		const id = e.metadata.id;
		byId[id] ??= Object.create(null);
		if (byId[id][e.lang]) {
			errors.push(
				`[E:id-lang-dup] Duplicate id='${id}' for lang='${e.lang}' slugs ('${byId[id][e.lang].slug}' vs '${e.slug}').`
			);
		} else {
			byId[id][e.lang] = e;
		}
	}

	for (const e of list) {
		if (/^\//.test(e.slug)) {
			warnings.push(`[W:leading-slash] slug '${e.slug}' should not start with '/'.`);
		}
	}

	return { bySlug, byId, errors, warnings };
}

// --- Public API (factory) ---------------------------------------------------

export interface ContentStore {
	contents: ContentEntry[];
	index: ContentIndex;
	validateIndex: () => boolean;
	assertValidIndex: () => void;
	getContent: (lang: string, slug: string) => ContentEntry | undefined;
	getTranslatedSlug: (
		currentLang: string,
		currentSlug: string,
		targetLang: string
	) => string | null;
	getHreflangAlternates: (
		lang: string,
		slug: string,
		origin: string
	) => Array<{ lang: string; href: string }>;
	contentRoutes: string[];
	contentEntries: () => Array<{ lang: string; slug: string }>;
}

/**
 * Create a content store from Vite glob modules (import.meta.glob result).
 * See {@link CreateContentOptions.basePath} for headless/non-root content layouts.
 */
export function createContent(
	modules: Record<string, any>,
	options: CreateContentOptions = {}
): ContentStore {
	const basePath = options.basePath ?? '/content/';
	const contents = parseModules(modules, basePath);
	const index = buildIndex(contents);

	function validateIndex() {
		if (index.errors.length) {
			console.error('[content] validation errors:\n' + index.errors.join('\n'));
			return false;
		}
		if (index.warnings.length) {
			console.warn('[content] warnings:\n' + index.warnings.join('\n'));
		}
		return true;
	}

	/**
	 * Strict variant of {@link validateIndex}: throws an `Error` (with every accumulated
	 * error message) instead of returning `false`. Warnings never throw — they are only
	 * logged via `console.warn`, same as `validateIndex()`. Intended for build/prerender
	 * hooks where invalid content should abort the build rather than silently ship it.
	 */
	function assertValidIndex(): void {
		if (index.warnings.length) {
			console.warn('[content] warnings:\n' + index.warnings.join('\n'));
		}
		if (index.errors.length) {
			throw new Error('[content] validation failed:\n' + index.errors.join('\n'));
		}
	}

	function normalizeRouteSlug(slug: string): string {
		return slug && slug.trim().length > 0 ? slug : '';
	}

	function getContent(lang: string, slug: string) {
		const normalizedSlug = normalizeRouteSlug(slug);
		return index.bySlug[slugKey(lang, normalizedSlug)];
	}

	function getTranslatedSlug(
		currentLang: string,
		currentSlug: string,
		targetLang: string
	): string | null {
		const current = index.bySlug[slugKey(currentLang, currentSlug)];
		if (!current) return null;
		const id = current.metadata.id;
		const t = index.byId[id]?.[targetLang];
		return t ? `${t.slug}` : null;
	}

	function getHreflangAlternates(
		lang: string,
		slug: string,
		origin: string
	): Array<{ lang: string; href: string }> {
		const current = index.bySlug[slugKey(lang, slug)];
		if (!current) return [];
		const id = current.metadata.id;
		const entries = index.byId[id] ?? {};
		const base = origin.replace(/\/+$/, '');
		return Object.values(entries).map((e) => ({
			lang: e.lang,
			href: `${base}/${e.lang}/${e.slug}`
		}));
	}

	const contentRoutes = contents.map((c) => `/${c.lang}/${c.slug}`);

	/**
	 * Derives SvelteKit `entries()` params from the loaded content, for routes shaped like
	 * `[[lang]]/[...slug]`: one `{ lang, slug }` pair per content entry (slug is '' for an
	 * index/home page). Feed this to `export function entries()` in the dynamic route's
	 * `+page.ts` so `adapter-static` knows which lang/slug combinations to prerender.
	 */
	function contentEntries(): Array<{ lang: string; slug: string }> {
		return contents.map((c) => ({ lang: c.lang, slug: c.slug }));
	}

	return {
		contents,
		index,
		validateIndex,
		assertValidIndex,
		getContent,
		getTranslatedSlug,
		getHreflangAlternates,
		contentRoutes,
		contentEntries
	};
}
