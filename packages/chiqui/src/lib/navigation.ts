import type { ContentEntry } from './types.js';
import { createContent, type ContentStore, type CreateContentOptions } from './content.js';

/**
 * A synthetic navigation node derived from content slugs (e.g. a language root or a
 * partial-path segment such as `guide` from `guide/intro`). Unlike `ContentEntry`, a
 * `NavItem` never claims to be backed by a real Markdown file: it has no `component`
 * and no full `ContentFrontmatter`, only what's needed to render a nav link.
 */
export type NavItem = {
	lang: string;
	slug: string;
	title: string;
};

export type PartialSlugOptions = {
	/** If provided, restrict results to a specific language */
	lang?: string;
	/** Include empty or "index" segments (defaults to false) */
	includeIndex?: boolean;
	/** Sort the output (defaults to true) */
	sort?: boolean;
};

const slugToTitle = (s: string) =>
	s
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (m) => m.toUpperCase());

/** Build a quick index to find titles for exact or index-matching slugs */
function buildLookup(entries: ContentEntry[]) {
	const map = new Map<string, ContentEntry>();
	for (const e of entries) {
		const key = `${e.lang}|${e.slug}`;
		map.set(key, e);
	}
	return {
		find(lang: string, partialSlug: string): ContentEntry | undefined {
			let hit = map.get(`${lang}|${partialSlug}`);
			if (hit) return hit;
			hit = map.get(`${lang}|${partialSlug}/index`) ?? map.get(`${lang}|${partialSlug}/_index`);
			return hit;
		}
	};
}

/** Get unique segments at a specific level across all slugs. */
export function getLevelContentEntries(
	level: number,
	entries: ContentEntry[],
	options: PartialSlugOptions = {}
): NavItem[] {
	const { lang, includeIndex = false, sort = true } = options;
	if (level < 0) throw new Error('Level must be >= 0');

	const lookup = buildLookup(entries);
	const results = new Map<string, NavItem>();

	for (const e of entries) {
		if (lang && e.lang !== lang) continue;

		if (level === 0) {
			const key = `${e.lang}|`;
			if (!results.has(key)) {
				results.set(key, {
					lang: e.lang,
					slug: `/${e.lang}`,
					title: e.lang.toUpperCase()
				});
			}
			continue;
		}

		const parts = (e.slug ?? '')
			.split('/')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		const seg = parts[level - 1];
		if (seg === undefined) {
			if (includeIndex) {
				const key = `${e.lang}|${e.slug}`;
				if (!results.has(key)) {
					results.set(key, {
						lang: e.lang,
						slug: `/${e.lang}/${e.slug}`,
						title: e.metadata?.title ?? slugToTitle(e.slug.split('/').pop() ?? '')
					});
				}
			}
			continue;
		}

		const lower = seg.toLowerCase();
		if (!includeIndex && (lower === 'index' || lower === '_index')) continue;

		const partialSlug = parts.slice(0, level).join('/');
		const resKey = `${e.lang}|${partialSlug}`;
		if (results.has(resKey)) continue;

		const idx = lookup.find(e.lang, partialSlug);
		const title = idx?.metadata?.title ?? slugToTitle(seg);

		results.set(resKey, {
			lang: e.lang,
			slug: `/${e.lang}/${partialSlug}`,
			title
		});
	}

	let arr = Array.from(results.values());
	if (sort) {
		arr = arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
	}
	return arr;
}

// --- Flat, ordered doc nav (sidebar + pager + translation fallback) ---------

/** Sidebar entry for a flat doc set: a title plus whether it's standing in for a missing translation. */
export type DocsNavEntry = {
	slug: string;
	title: string;
	untranslated: boolean;
};

/** A resolved doc — the matching `ContentEntry` plus whether it's a default-locale fallback. */
export type ResolvedDocsEntry = ContentEntry & { untranslated: boolean };

export type CreateDocsNavOptions = {
	/** Canonical locale: source of truth for the page set and its order, and the fallback used when a translation is missing. */
	defaultLang: string;
	/** Restrict the doc set to a subset of the store's entries (e.g. if it also holds non-doc content). Defaults to every entry. */
	filter?: (entry: ContentEntry) => boolean;
};

export type DocsNav = {
	/** Ordered doc list for a locale: every default-locale page, with translated titles where available. */
	navFor(lang: string): DocsNavEntry[];
	/** Resolves one doc by slug, falling back to `defaultLang` (flagged `untranslated`) when the translation is missing. */
	resolve(lang: string, slug: string): ResolvedDocsEntry | undefined;
	/** Previous/next neighbors in `navFor`'s order, for an in-page pager. */
	neighbors(lang: string, slug: string): { previous?: DocsNavEntry; next?: DocsNavEntry };
	/** Slug of the first default-locale doc (e.g. to serve at a bare `/docs` index route). */
	readonly defaultSlug: string;
	/** Whether a slug exists at all, independent of locale (e.g. for a 404 check). */
	hasSlug(slug: string): boolean;
};

const titleOf = (entry: ContentEntry): string => entry.metadata?.title ?? entry.slug;
const orderOf = (entry: ContentEntry): number =>
	(entry.metadata as { order?: number })?.order ?? Number.MAX_SAFE_INTEGER;

/**
 * Builds an ordered, translation-aware navigation surface over a *flat* set of docs — the
 * shape a typical `/docs` section needs: pages sorted by `order` frontmatter (falling back to
 * title), translated where available, with a missing translation falling back to
 * `defaultLang` and flagged `untranslated` instead of silently disappearing or 404ing.
 *
 * This is opinionated on purpose (the sort rule, this exact fallback behavior) — it's a
 * headless building block for a single-level doc index with a sidebar/pager, not a general
 * nav-tree builder. For hierarchical nav derived from slug segments, see
 * `getLevelContentEntries`; for anything else, build directly on `ContentStore.getContent`.
 */
export function createDocsNav(store: ContentStore, options: CreateDocsNavOptions): DocsNav {
	const { defaultLang, filter } = options;

	const defaultDocs = store.contents
		.filter((e) => e.lang === defaultLang && (!filter || filter(e)))
		.sort((a, b) => orderOf(a) - orderOf(b) || titleOf(a).localeCompare(titleOf(b)));

	function navFor(lang: string): DocsNavEntry[] {
		return defaultDocs.map((doc) => {
			const translated = store.getContent(lang, doc.slug);
			return {
				slug: doc.slug,
				title: titleOf(translated ?? doc),
				untranslated: !translated
			};
		});
	}

	function resolve(lang: string, slug: string): ResolvedDocsEntry | undefined {
		const translated = store.getContent(lang, slug);
		if (translated) return { ...translated, untranslated: false };

		const fallback = store.getContent(defaultLang, slug);
		return fallback ? { ...fallback, untranslated: true } : undefined;
	}

	function neighbors(lang: string, slug: string) {
		const entries = navFor(lang);
		const index = entries.findIndex((e) => e.slug === slug);
		return {
			previous: index > 0 ? entries[index - 1] : undefined,
			next: index >= 0 && index < entries.length - 1 ? entries[index + 1] : undefined
		};
	}

	return {
		navFor,
		resolve,
		neighbors,
		defaultSlug: defaultDocs[0]?.slug ?? '',
		hasSlug: (slug: string) => defaultDocs.some((e) => e.slug === slug)
	};
}

// --- One-call setup: glob modules in, a ready DocsNav out ------------------

export type CreateDocsSectionOptions = CreateContentOptions &
	CreateDocsNavOptions & {
		/**
		 * Throws (via `assertValidIndex`) on invalid content — duplicate slugs, an id
		 * collision — instead of just logging and continuing (`validateIndex`). Defaults to
		 * `true`: a docs section is usually content a build should refuse to ship broken.
		 */
		strict?: boolean;
	};

/**
 * Glob modules in, a ready `DocsNav` out — the one-call version of
 * `createContent(modules, opts) → assertValidIndex() → createDocsNav(store, opts)` for the
 * common case where nothing in between needs customizing. Exposes the underlying `store` too
 * (e.g. for `store.contentEntries()` if the section ends up prerendered, or
 * `store.getTranslatedSlug()`), so reaching for the one-call version doesn't cost access to
 * the lower-level API if a later need doesn't fit `DocsNav`.
 *
 * ```ts
 * const modules = import.meta.glob('./content/*\/*.md', { eager: true });
 * export const docs = createDocsSection(modules, { basePath: './content/', defaultLang: 'en' });
 * // docs.navFor(lang), docs.resolve(lang, slug), docs.neighbors(lang, slug), docs.store...
 * ```
 */
export function createDocsSection(
	modules: Record<string, any>,
	options: CreateDocsSectionOptions
): DocsNav & { store: ContentStore } {
	const { basePath, defaultLang, filter, strict = true } = options;
	const store = createContent(modules, { basePath });

	if (strict) store.assertValidIndex();
	else store.validateIndex();

	return { ...createDocsNav(store, { defaultLang, filter }), store };
}
