import { describe, it, expect } from 'vitest';
import { generateSitemapXml, type SitemapContentStore } from '../src/lib/sitemap.js';
import { createContent } from '../src/lib/content.js';
import type { Component } from 'svelte';

const FakeComponent = {} as Component;

function makeStore(): SitemapContentStore {
	return createContent({
		'/content/en/about.md': {
			metadata: { id: 'about', title: 'About' },
			default: FakeComponent
		},
		'/content/es/acerca.md': {
			metadata: { id: 'about', title: 'Acerca' },
			default: FakeComponent
		},
		'/content/en/index.md': { metadata: { id: 'home' }, default: FakeComponent },
		'/content/es/index.md': { metadata: { id: 'home' }, default: FakeComponent }
	});
}

describe('generateSitemapXml', () => {
	it('produces a well-formed urlset with the XML declaration and namespaces', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com');
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(xml).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
		);
		expect(xml.trim().endsWith('</urlset>')).toBe(true);
		// balanced <url>...</url> blocks, one per content entry
		expect((xml.match(/<url>/g) ?? []).length).toBe(4);
		expect((xml.match(/<\/url>/g) ?? []).length).toBe(4);
	});

	it('includes a <loc> for every content entry', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com');
		expect(xml).toContain('<loc>https://example.com/en/about</loc>');
		expect(xml).toContain('<loc>https://example.com/es/acerca</loc>');
	});

	it('normalizes a trailing slash on the origin', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com/');
		expect(xml).toContain('<loc>https://example.com/en/about</loc>');
		expect(xml).not.toContain('example.com//');
	});

	it('adds xhtml:link hreflang alternates for translated pages', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com');
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/about" />'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/acerca" />'
		);
	});

	it('adds an x-default link pointing at the defaultLang alternate when requested', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com', { defaultLang: 'en' });
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/en/about" />'
		);
	});

	it('omits x-default when defaultLang option is not provided', () => {
		const xml = generateSitemapXml(makeStore(), 'https://example.com');
		expect(xml).not.toContain('x-default');
	});

	it('omits x-default when the requested defaultLang has no alternate for that entry', () => {
		const store = createContent({
			'/content/en/only.md': { metadata: { id: 'only-en' }, default: FakeComponent }
		});
		const xml = generateSitemapXml(store, 'https://example.com', { defaultLang: 'fr' });
		expect(xml).not.toContain('x-default');
	});

	it('escapes XML-special characters in loc and href', () => {
		const store = createContent({
			'/content/en/tag&amp.md': { metadata: { id: 'tricky' }, default: FakeComponent }
		});
		const xml = generateSitemapXml(store, 'https://example.com');
		expect(xml).toContain('<loc>https://example.com/en/tag&amp;amp</loc>');
		expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;)/);
	});

	it('returns an empty urlset for an empty content store', () => {
		const store = createContent({});
		const xml = generateSitemapXml(store, 'https://example.com');
		expect(xml).not.toContain('<url>');
		expect(xml).toContain('<urlset');
		expect(xml).toContain('</urlset>');
	});
});
