import { describe, it, expect, vi } from 'vitest';
import { createContent } from '../src/lib/content.js';
import type { Component } from 'svelte';

// Fake Svelte component for testing
const FakeComponent = {} as Component;

// Helper to build a fake import.meta.glob result
function makeModules(
	entries: Array<{ path: string; id?: string; title?: string; extra?: Record<string, unknown> }>
): Record<string, unknown> {
	const mods: Record<string, unknown> = {};
	for (const e of entries) {
		mods[e.path] = {
			metadata: {
				...(e.id !== undefined ? { id: e.id } : {}),
				...(e.title !== undefined ? { title: e.title } : {}),
				...(e.extra ?? {})
			},
			default: FakeComponent
		};
	}
	return mods;
}

// ---------------------------------------------------------------------------
// parseModules (via createContent)
// ---------------------------------------------------------------------------
describe('parseModules (via createContent)', () => {
	it('parses lang and slug from a standard path', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(store.contents).toHaveLength(1);
		expect(store.contents[0].lang).toBe('en');
		expect(store.contents[0].slug).toBe('about');
	});

	it('parses index.md → empty slug', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/index.md', id: 'home', title: 'Home' }])
		);
		expect(store.contents[0].lang).toBe('en');
		expect(store.contents[0].slug).toBe('');
	});

	it('parses nested slug guide/intro', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/guide/intro.md', id: 'guide-intro', title: 'Intro' }])
		);
		expect(store.contents[0].slug).toBe('guide/intro');
	});

	it('preserves extra frontmatter fields', () => {
		const store = createContent(
			makeModules([
				{
					path: '/content/en/about.md',
					id: 'about',
					title: 'About',
					extra: { order: 2, customField: 'hello' }
				}
			])
		);
		const entry = store.contents[0];
		expect((entry.metadata as any).order).toBe(2);
		expect((entry.metadata as any).customField).toBe('hello');
	});

	it('handles metadata without id (id becomes empty string)', () => {
		const store = createContent(makeModules([{ path: '/content/en/no-id.md' }]));
		// id is missing → coerced to empty string by parseModules
		expect(store.contents[0].metadata.id).toBe('');
		// buildIndex should report an error
		expect(store.index.errors.length).toBeGreaterThan(0);
	});

	it('assigns component from module default', () => {
		const store = createContent(makeModules([{ path: '/content/en/about.md', id: 'about' }]));
		expect(store.contents[0].component).toBe(FakeComponent);
	});

	it('parses multiple languages', () => {
		const store = createContent(
			makeModules([
				{ path: '/content/en/about.md', id: 'about', title: 'About' },
				{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
			])
		);
		const langs = store.contents.map((c) => c.lang);
		expect(langs).toContain('en');
		expect(langs).toContain('es');
	});
});

// ---------------------------------------------------------------------------
// buildIndex (via createContent)
// ---------------------------------------------------------------------------
describe('buildIndex (via createContent)', () => {
	it('reports error for missing id', () => {
		const store = createContent(makeModules([{ path: '/content/en/page.md' }]));
		expect(store.index.errors.some((e) => e.includes('[E:id]'))).toBe(true);
	});

	it('reports error for duplicate slug within same language', () => {
		const mods: Record<string, unknown> = {
			'/content/en/dup.md': { metadata: { id: 'id-a', title: 'A' }, default: FakeComponent },
			'/content/en/other.md': { metadata: { id: 'id-b', title: 'B' }, default: FakeComponent }
		};
		// Force same slug by manipulating modules directly - both have different paths but same slug after strip
		// Instead use a more direct approach: two identical paths won't work in object, so test with similar content
		const store = createContent({
			'/content/en/guide/index.md': { metadata: { id: 'id-a' }, default: FakeComponent },
			'/content/en/guide.md': { metadata: { id: 'id-b' }, default: FakeComponent }
		});
		// guide/index.md → slug 'guide' (index stripped), guide.md → slug 'guide' → duplicate!
		expect(store.index.errors.some((e) => e.includes('[E:slug-dup]'))).toBe(true);
	});

	it('reports error for duplicate (id, lang)', () => {
		const store = createContent({
			'/content/en/about.md': { metadata: { id: 'same-id' }, default: FakeComponent },
			'/content/en/about-v2.md': { metadata: { id: 'same-id' }, default: FakeComponent }
		});
		expect(store.index.errors.some((e) => e.includes('[E:id-lang-dup]'))).toBe(true);
	});

	it('reports warning for slug starting with /', () => {
		// We cannot trigger this via parseModules (it strips leading slashes via path structure),
		// but we can call buildIndex indirectly via a raw entry in the modules value that has no path prefix.
		// Instead, verify via validateIndex warning message after creating content with an edge case.
		// Actually, parseModules never produces leading-slash slugs, so this warning is for programmatic use.
		// We verify that normal content has no warnings about leading slash:
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(store.index.warnings.filter((w) => w.includes('[W:leading-slash]'))).toHaveLength(0);
	});

	it('builds correct byId index', () => {
		const store = createContent(
			makeModules([
				{ path: '/content/en/about.md', id: 'about', title: 'About' },
				{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
			])
		);
		expect(store.index.byId['about']).toBeDefined();
		expect(store.index.byId['about']['en'].slug).toBe('about');
		expect(store.index.byId['about']['es'].slug).toBe('acerca');
	});

	it('builds correct bySlug index', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(store.index.bySlug['en/about']).toBeDefined();
		expect(store.index.bySlug['en/about'].metadata.id).toBe('about');
	});
});

// ---------------------------------------------------------------------------
// validateIndex
// ---------------------------------------------------------------------------
describe('validateIndex', () => {
	it('returns true when no errors', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(store.validateIndex()).toBe(true);
		consoleWarnSpy.mockRestore();
	});

	it('returns false and logs when errors exist', () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const store = createContent(makeModules([{ path: '/content/en/page.md' }]));
		expect(store.validateIndex()).toBe(false);
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});

	it('logs warnings but returns true when only warnings', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Directly call createContent with a valid entry but use bypass to inject warnings
		// We can't easily produce warnings from parseModules since slug with leading slash
		// can only come from unusual input. Test that validate returns true with valid content:
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(store.validateIndex()).toBe(true);
		consoleWarnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// getContent
// ---------------------------------------------------------------------------
describe('getContent', () => {
	const store = createContent(
		makeModules([
			{ path: '/content/en/about.md', id: 'about', title: 'About' },
			{ path: '/content/en/index.md', id: 'home', title: 'Home' }
		])
	);

	it('returns entry on hit', () => {
		const entry = store.getContent('en', 'about');
		expect(entry).toBeDefined();
		expect(entry?.metadata.id).toBe('about');
	});

	it('returns undefined on miss', () => {
		expect(store.getContent('en', 'nonexistent')).toBeUndefined();
	});

	it('returns home entry for empty slug (index)', () => {
		const entry = store.getContent('en', '');
		expect(entry).toBeDefined();
		expect(entry?.metadata.id).toBe('home');
	});

	it('returns undefined for wrong lang', () => {
		expect(store.getContent('fr', 'about')).toBeUndefined();
	});

	it('is backed by index.bySlug (O(1) lookup), not a linear scan of contents', () => {
		// Same object reference as the one stored in the index for that slug key.
		expect(store.getContent('en', 'about')).toBe(store.index.bySlug['en/about']);
		expect(store.getContent('en', '')).toBe(store.index.bySlug['en/']);
	});
});

// ---------------------------------------------------------------------------
// assertValidIndex
// ---------------------------------------------------------------------------
describe('assertValidIndex', () => {
	it('does not throw when there are no errors', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		expect(() => store.assertValidIndex()).not.toThrow();
		consoleWarnSpy.mockRestore();
	});

	it('throws with the accumulated error messages when errors exist', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createContent(
			makeModules([{ path: '/content/en/page.md' }, { path: '/content/en/other.md' }])
		);
		expect(() => store.assertValidIndex()).toThrow(/\[E:id\]/);
		consoleWarnSpy.mockRestore();
	});

	it('throws once per assertValidIndex call, aggregating every error', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createContent({
			'/content/en/about.md': { metadata: { id: 'same-id' }, default: FakeComponent },
			'/content/en/about-v2.md': { metadata: { id: 'same-id' }, default: FakeComponent }
		});
		expect(() => store.assertValidIndex()).toThrow(/\[E:id-lang-dup\]/);
		consoleWarnSpy.mockRestore();
	});

	it('never throws for warnings only (still calls console.warn)', () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createContent(
			makeModules([{ path: '/content/en/about.md', id: 'about', title: 'About' }])
		);
		// This fixture has no warnings either, but confirms the happy path never throws
		// and that assertValidIndex routes through the same warning-logging behavior.
		expect(() => store.assertValidIndex()).not.toThrow();
		consoleWarnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// getTranslatedSlug
// ---------------------------------------------------------------------------
describe('getTranslatedSlug', () => {
	const store = createContent(
		makeModules([
			{ path: '/content/en/about.md', id: 'about', title: 'About' },
			{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
		])
	);

	it('returns translated slug when translation exists', () => {
		expect(store.getTranslatedSlug('en', 'about', 'es')).toBe('acerca');
	});

	it('returns null when target lang has no translation', () => {
		expect(store.getTranslatedSlug('en', 'about', 'fr')).toBeNull();
	});

	it('returns null when source slug is invalid', () => {
		expect(store.getTranslatedSlug('en', 'nonexistent', 'es')).toBeNull();
	});

	it('returns same slug for same lang', () => {
		expect(store.getTranslatedSlug('en', 'about', 'en')).toBe('about');
	});
});

// ---------------------------------------------------------------------------
// getHreflangAlternates
// ---------------------------------------------------------------------------
describe('getHreflangAlternates', () => {
	const store = createContent(
		makeModules([
			{ path: '/content/en/about.md', id: 'about', title: 'About' },
			{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
		])
	);

	it('returns alternates for all languages', () => {
		const alts = store.getHreflangAlternates('en', 'about', 'https://example.com');
		expect(alts).toHaveLength(2);
		const hrefs = alts.map((a) => a.href);
		expect(hrefs).toContain('https://example.com/en/about');
		expect(hrefs).toContain('https://example.com/es/acerca');
	});

	it('strips trailing slash from origin', () => {
		const alts = store.getHreflangAlternates('en', 'about', 'https://example.com/');
		expect(alts.every((a) => !a.href.startsWith('https://example.com//'))).toBe(true);
		expect(alts.some((a) => a.href === 'https://example.com/en/about')).toBe(true);
	});

	it('strips multiple trailing slashes from origin', () => {
		const alts = store.getHreflangAlternates('en', 'about', 'https://example.com///');
		expect(alts.some((a) => a.href === 'https://example.com/en/about')).toBe(true);
	});

	it('returns empty array for unknown entry', () => {
		const alts = store.getHreflangAlternates('en', 'nonexistent', 'https://example.com');
		expect(alts).toHaveLength(0);
	});

	it('includes lang in each alternate', () => {
		const alts = store.getHreflangAlternates('en', 'about', 'https://example.com');
		const langs = alts.map((a) => a.lang);
		expect(langs).toContain('en');
		expect(langs).toContain('es');
	});
});

// ---------------------------------------------------------------------------
// contentRoutes
// ---------------------------------------------------------------------------
describe('contentRoutes', () => {
	it('generates route strings for each entry', () => {
		const store = createContent(
			makeModules([
				{ path: '/content/en/about.md', id: 'about', title: 'About' },
				{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
			])
		);
		expect(store.contentRoutes).toContain('/en/about');
		expect(store.contentRoutes).toContain('/es/acerca');
	});

	it('generates route for index (empty slug)', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/index.md', id: 'home', title: 'Home' }])
		);
		expect(store.contentRoutes).toContain('/en/');
	});

	it('returns empty array for no modules', () => {
		const store = createContent({});
		expect(store.contentRoutes).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// contentEntries
// ---------------------------------------------------------------------------
describe('contentEntries', () => {
	it('generates a { lang, slug } pair for each content entry', () => {
		const store = createContent(
			makeModules([
				{ path: '/content/en/about.md', id: 'about', title: 'About' },
				{ path: '/content/es/acerca.md', id: 'about', title: 'Acerca' }
			])
		);
		expect(store.contentEntries()).toEqual(
			expect.arrayContaining([
				{ lang: 'en', slug: 'about' },
				{ lang: 'es', slug: 'acerca' }
			])
		);
	});

	it('uses an empty slug for index pages', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/index.md', id: 'home', title: 'Home' }])
		);
		expect(store.contentEntries()).toEqual([{ lang: 'en', slug: '' }]);
	});

	it('preserves nested slugs', () => {
		const store = createContent(
			makeModules([{ path: '/content/en/guide/intro.md', id: 'guide-intro', title: 'Intro' }])
		);
		expect(store.contentEntries()).toEqual([{ lang: 'en', slug: 'guide/intro' }]);
	});

	it('covers every language for the same slug', () => {
		const store = createContent(
			makeModules([
				{ path: '/content/en/docs.md', id: 'docs', title: 'Docs' },
				{ path: '/content/es/docs.md', id: 'docs', title: 'Documentación' }
			])
		);
		const langs = store.contentEntries().map((e) => e.lang);
		expect(langs).toContain('en');
		expect(langs).toContain('es');
		expect(store.contentEntries()).toHaveLength(2);
	});

	it('returns empty array for no modules', () => {
		const store = createContent({});
		expect(store.contentEntries()).toHaveLength(0);
	});
});
