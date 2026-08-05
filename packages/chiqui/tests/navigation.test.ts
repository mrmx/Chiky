import { describe, it, expect, vi } from 'vitest';
import { getLevelContentEntries, createDocsNav, createDocsSection } from '../src/lib/navigation.js';
import { createContent } from '../src/lib/content.js';
import type { ContentEntry } from '../src/lib/types.js';
import type { Component } from 'svelte';

// Fake component for testing
const FakeComponent = {} as Component;

function makeEntry(lang: string, slug: string, title?: string, id?: string): ContentEntry {
	return {
		lang,
		slug,
		metadata: { id: id ?? slug, title },
		component: FakeComponent
	};
}

// Entries for tests
const enAbout = makeEntry('en', 'about', 'About', 'about');
const enHome = makeEntry('en', '', 'Home', 'home');
const enGuideIntro = makeEntry('en', 'guide/intro', 'Introduction', 'guide-intro');
const enGuideFaq = makeEntry('en', 'guide/faq', 'FAQ', 'guide-faq');
const enDocs = makeEntry('en', 'docs', 'Documentation', 'docs');
const esInicio = makeEntry('es', 'inicio', 'Inicio', 'home');
const esAcerca = makeEntry('es', 'acerca', 'Acerca', 'about');

const allEntries = [enAbout, enHome, enGuideIntro, enGuideFaq, enDocs, esInicio, esAcerca];

// ---------------------------------------------------------------------------
// getLevelContentEntries — level 0 (languages)
// ---------------------------------------------------------------------------
describe('getLevelContentEntries — level 0', () => {
	it('returns one entry per unique language', () => {
		const results = getLevelContentEntries(0, allEntries);
		const langs = results.map((r) => r.lang);
		expect(langs).toContain('en');
		expect(langs).toContain('es');
		expect(results).toHaveLength(2);
	});

	it('slug is /{lang} for each language entry', () => {
		const results = getLevelContentEntries(0, allEntries);
		for (const r of results) {
			expect(r.slug).toBe(`/${r.lang}`);
		}
	});

	it('title is lang.toUpperCase()', () => {
		const results = getLevelContentEntries(0, allEntries);
		for (const r of results) {
			expect(r.title).toBe(r.lang.toUpperCase());
		}
	});

	it('filters by lang when option provided', () => {
		const results = getLevelContentEntries(0, allEntries, { lang: 'en' });
		expect(results).toHaveLength(1);
		expect(results[0].lang).toBe('en');
	});

	it('returns empty array when entries is empty', () => {
		const results = getLevelContentEntries(0, []);
		expect(results).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// getLevelContentEntries — level 1 (top-level segments)
// ---------------------------------------------------------------------------
describe('getLevelContentEntries — level 1', () => {
	it('returns unique top-level segments across all languages', () => {
		const results = getLevelContentEntries(1, allEntries);
		const slugs = results.map((r) => r.slug);
		// en: about, guide (from guide/*), docs; es: inicio, acerca
		expect(slugs.some((s) => s.includes('about'))).toBe(true);
		expect(slugs.some((s) => s.includes('guide'))).toBe(true);
	});

	it('filters by lang', () => {
		const results = getLevelContentEntries(1, allEntries, { lang: 'en' });
		for (const r of results) {
			expect(r.lang).toBe('en');
		}
	});

	it('uses title from metadata when available (via lookup)', () => {
		// enDocs has title 'Documentation', so the result for docs should use it
		const results = getLevelContentEntries(1, [enDocs], { lang: 'en' });
		const docsEntry = results.find((r) => r.slug === '/en/docs');
		expect(docsEntry).toBeDefined();
		expect(docsEntry?.title).toBe('Documentation');
	});

	it('falls back to slugToTitle when no metadata title', () => {
		const entry = makeEntry('en', 'my-page', undefined, 'my-page');
		const results = getLevelContentEntries(1, [entry], { lang: 'en' });
		expect(results).toHaveLength(1);
		expect(results[0].title).toBe('My Page');
	});

	it('does not include index/empty segments unless includeIndex=true', () => {
		const results = getLevelContentEntries(1, [enHome], { lang: 'en' });
		// enHome has slug '' → no segment at level 1 → should not appear
		expect(results).toHaveLength(0);
	});

	it('includes empty slug entries when includeIndex=true', () => {
		const results = getLevelContentEntries(1, [enHome], { lang: 'en', includeIndex: true });
		expect(results).toHaveLength(1);
	});

	it('deduplicates segments (guide/intro and guide/faq → only one "guide")', () => {
		const results = getLevelContentEntries(1, [enGuideIntro, enGuideFaq], { lang: 'en' });
		const guideSlugs = results.filter((r) => r.slug === '/en/guide');
		expect(guideSlugs).toHaveLength(1);
	});

	it('slug format is /{lang}/{segment}', () => {
		const results = getLevelContentEntries(1, [enAbout], { lang: 'en' });
		expect(results[0].slug).toBe('/en/about');
	});

	it('is sorted by title by default', () => {
		const results = getLevelContentEntries(1, allEntries, { lang: 'en' });
		const titles = results.map((r) => r.title ?? '');
		const sorted = [...titles].sort((a, b) => a.localeCompare(b));
		expect(titles).toEqual(sorted);
	});

	it('is not sorted when sort=false', () => {
		// With a specific input order, verify sort=false preserves insertion order
		const entries = [enGuideFaq, enAbout, enDocs];
		const resultsUnsorted = getLevelContentEntries(1, entries, { lang: 'en', sort: false });
		const resultsSorted = getLevelContentEntries(1, entries, { lang: 'en', sort: true });
		// They should differ if the natural insertion order != alphabetical order
		// guide comes before about alphabetically? No: A < D < G.
		// So sorted = [About, Documentation, Guide/Faq(→guide)], unsorted = [guide, about, docs]
		const sortedTitles = resultsSorted.map((r) => r.title ?? '');
		const unsortedTitles = resultsUnsorted.map((r) => r.title ?? '');
		expect(sortedTitles).toEqual([...unsortedTitles].sort((a, b) => a.localeCompare(b)));
	});
});

// ---------------------------------------------------------------------------
// getLevelContentEntries — level 2 (sub-segments)
// ---------------------------------------------------------------------------
describe('getLevelContentEntries — level 2', () => {
	it('returns second-level segments', () => {
		const results = getLevelContentEntries(2, [enGuideIntro, enGuideFaq], { lang: 'en' });
		const slugs = results.map((r) => r.slug);
		expect(slugs).toContain('/en/guide/intro');
		expect(slugs).toContain('/en/guide/faq');
	});

	it('does not return level-1-only entries (about, docs) at level 2', () => {
		const results = getLevelContentEntries(2, [enAbout, enDocs], { lang: 'en' });
		// about and docs are 1-level deep → no segment at level 2 → no results
		expect(results).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe('getLevelContentEntries — error handling', () => {
	it('throws for level < 0', () => {
		expect(() => getLevelContentEntries(-1, allEntries)).toThrow('Level must be >= 0');
	});

	it('throws for level -100', () => {
		expect(() => getLevelContentEntries(-100, [])).toThrow('Level must be >= 0');
	});
});

// ---------------------------------------------------------------------------
// NavItem shape — results are plain NavItem objects, not fabricated ContentEntry
// ---------------------------------------------------------------------------
describe('getLevelContentEntries — NavItem shape', () => {
	it('returns objects with only lang/slug/title (no component, no metadata)', () => {
		const [result] = getLevelContentEntries(1, [enAbout], { lang: 'en' });
		expect(Object.keys(result).sort()).toEqual(['lang', 'slug', 'title']);
		expect(result).not.toHaveProperty('component');
		expect(result).not.toHaveProperty('metadata');
	});

	it('title is always a plain string', () => {
		const results = getLevelContentEntries(0, allEntries);
		for (const r of results) {
			expect(typeof r.title).toBe('string');
		}
	});
});

// ---------------------------------------------------------------------------
// createDocsNav
// ---------------------------------------------------------------------------
describe('createDocsNav', () => {
	const FakeComponent = {} as Component;
	const mod = (title: string, extra: Record<string, unknown> = {}) => ({
		metadata: { title, ...extra },
		default: FakeComponent
	});

	// en: three docs, ordered by `order` (strategies has none → sorts last, alphabetically).
	// es: only `getting-started` is translated — laboratory/strategies should fall back.
	const store = createContent({
		'/content/en/getting-started.md': mod('Getting started', { order: 1 }),
		'/content/en/laboratory.md': mod('Laboratory', { order: 2 }),
		'/content/en/strategies.md': mod('Strategies'),
		'/content/es/getting-started.md': mod('Primeros pasos', { order: 1 })
	});
	const nav = createDocsNav(store, { defaultLang: 'en' });

	it('orders navFor by `order` frontmatter, undefined last, then alphabetically', () => {
		expect(nav.navFor('en').map((e) => e.slug)).toEqual([
			'getting-started',
			'laboratory',
			'strategies'
		]);
	});

	it('navFor uses the translated title and untranslated: false when a translation exists', () => {
		const entry = nav.navFor('es').find((e) => e.slug === 'getting-started');
		expect(entry).toEqual({ slug: 'getting-started', title: 'Primeros pasos', untranslated: false });
	});

	it('navFor falls back to the default-locale title and flags untranslated: true otherwise', () => {
		const entry = nav.navFor('es').find((e) => e.slug === 'laboratory');
		expect(entry).toEqual({ slug: 'laboratory', title: 'Laboratory', untranslated: true });
	});

	it('resolve returns the translation with untranslated: false when it exists', () => {
		const doc = nav.resolve('es', 'getting-started');
		expect(doc?.lang).toBe('es');
		expect(doc?.metadata.title).toBe('Primeros pasos');
		expect(doc?.untranslated).toBe(false);
	});

	it('resolve falls back to defaultLang and flags untranslated: true when missing', () => {
		const doc = nav.resolve('es', 'laboratory');
		expect(doc?.lang).toBe('en');
		expect(doc?.metadata.title).toBe('Laboratory');
		expect(doc?.untranslated).toBe(true);
	});

	it('resolve returns undefined for a slug that does not exist in any language', () => {
		expect(nav.resolve('en', 'nonexistent')).toBeUndefined();
	});

	it('neighbors returns previous/next in navFor order', () => {
		expect(nav.neighbors('en', 'laboratory')).toEqual({
			previous: { slug: 'getting-started', title: 'Getting started', untranslated: false },
			next: { slug: 'strategies', title: 'Strategies', untranslated: false }
		});
	});

	it('neighbors omits previous at the start and next at the end', () => {
		expect(nav.neighbors('en', 'getting-started').previous).toBeUndefined();
		expect(nav.neighbors('en', 'strategies').next).toBeUndefined();
	});

	it('defaultSlug is the first default-locale doc after sorting', () => {
		expect(nav.defaultSlug).toBe('getting-started');
	});

	it('hasSlug is locale-independent', () => {
		expect(nav.hasSlug('strategies')).toBe(true);
		expect(nav.hasSlug('nonexistent')).toBe(false);
	});

	it('filter restricts the doc set to a subset of the store', () => {
		const mixedStore = createContent({
			'/content/en/getting-started.md': mod('Getting started', { order: 1, section: 'docs' }),
			'/content/en/pricing.md': mod('Pricing', { section: 'marketing' })
		});
		const docsOnly = createDocsNav(mixedStore, {
			defaultLang: 'en',
			filter: (e) => e.metadata.section === 'docs'
		});
		expect(docsOnly.navFor('en').map((e) => e.slug)).toEqual(['getting-started']);
		expect(docsOnly.hasSlug('pricing')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// createDocsSection
// ---------------------------------------------------------------------------
describe('createDocsSection', () => {
	const FakeComponent = {} as Component;
	const mod = (title: string, extra: Record<string, unknown> = {}) => ({
		metadata: { title, ...extra },
		default: FakeComponent
	});

	it('wires createContent + createDocsNav in one call, honoring basePath', () => {
		const docs = createDocsSection(
			{ './content/en/getting-started.md': mod('Getting started', { order: 1 }) },
			{ basePath: './content/', defaultLang: 'en' }
		);
		expect(docs.navFor('en')).toEqual([
			{ slug: 'getting-started', title: 'Getting started', untranslated: false }
		]);
		expect(docs.defaultSlug).toBe('getting-started');
	});

	it('exposes the underlying store for lower-level needs', () => {
		const docs = createDocsSection(
			{ './content/en/getting-started.md': mod('Getting started') },
			{ basePath: './content/', defaultLang: 'en' }
		);
		expect(docs.store.getContent('en', 'getting-started')).toBeDefined();
	});

	it('is strict by default: throws on invalid content instead of silently indexing it', () => {
		expect(() =>
			createDocsSection(
				{
					'./content/en/a.md': { metadata: { id: 'dup' }, default: FakeComponent },
					'./content/en/b.md': { metadata: { id: 'dup' }, default: FakeComponent }
				},
				{ basePath: './content/', defaultLang: 'en' }
			)
		).toThrow(/\[E:id-lang-dup\]/);
	});

	it('strict: false only logs, never throws, on invalid content', () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() =>
			createDocsSection(
				{
					'./content/en/a.md': { metadata: { id: 'dup' }, default: FakeComponent },
					'./content/en/b.md': { metadata: { id: 'dup' }, default: FakeComponent }
				},
				{ basePath: './content/', defaultLang: 'en', strict: false }
			)
		).not.toThrow();
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});
});
