// Content loading & validation utilities for chiqui SSG.
// The consumer calls createContent(modules) passing the result of
// import.meta.glob('/content/**/*.md', { eager: true }).
// This keeps Vite's glob in the consumer's context while chiqui owns the logic.

import type { Component } from 'svelte';
import type { ContentEntry, ContentFrontmatter, ContentIndex } from './types.js';

// --- Parse glob modules into content entries --------------------------------

function parseModules(modules: Record<string, any>): ContentEntry[] {
	return Object.entries(modules).map(([path, mod]: [string, any]) => {
		const parts = path
			.replace(/^\/content\//, '')
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
				id: String(md.id ?? ''),
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

/** Create a content store from Vite glob modules (import.meta.glob result). */
export function createContent(modules: Record<string, any>): ContentStore {
	const contents = parseModules(modules);
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

	function normalizeRouteSlug(slug: string): string {
		return slug && slug.trim().length > 0 ? slug : '';
	}

	function getContent(lang: string, slug: string) {
		const normalizedSlug = normalizeRouteSlug(slug);
		return contents.find((entry) => entry.lang === lang && entry.slug === normalizedSlug);
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
		getContent,
		getTranslatedSlug,
		getHreflangAlternates,
		contentRoutes,
		contentEntries
	};
}
