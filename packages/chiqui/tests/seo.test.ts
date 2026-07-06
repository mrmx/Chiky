import { describe, it, expect } from 'vitest';
import {
	normalizeOrigin,
	buildCanonicalPath,
	buildPageTitle,
	toAbsoluteUrl,
	findDefaultAlternate
} from '../src/lib/seo.js';

describe('normalizeOrigin', () => {
	it('leaves a clean origin untouched', () => {
		expect(normalizeOrigin('https://example.com')).toBe('https://example.com');
	});

	it('strips a single trailing slash', () => {
		expect(normalizeOrigin('https://example.com/')).toBe('https://example.com');
	});

	it('strips multiple trailing slashes', () => {
		expect(normalizeOrigin('https://example.com///')).toBe('https://example.com');
	});
});

describe('buildCanonicalPath', () => {
	it('builds a clean path for a non-empty slug', () => {
		expect(buildCanonicalPath('en', 'about')).toBe('/en/about');
	});

	it('builds a clean path (no trailing slash) for an empty slug (home page)', () => {
		expect(buildCanonicalPath('es', '')).toBe('/es');
	});

	it('preserves nested slugs', () => {
		expect(buildCanonicalPath('en', 'guide/intro')).toBe('/en/guide/intro');
	});
});

describe('buildPageTitle', () => {
	it('renders "siteName — title" when a title is given', () => {
		expect(buildPageTitle('Chiqui', 'About')).toBe('Chiqui — About');
	});

	it('renders just siteName when there is no title', () => {
		expect(buildPageTitle('Chiqui', undefined)).toBe('Chiqui');
	});

	it('renders just siteName when title is an empty string', () => {
		expect(buildPageTitle('Chiqui', '')).toBe('Chiqui');
	});
});

describe('toAbsoluteUrl', () => {
	it('resolves a root-relative path against the origin', () => {
		expect(toAbsoluteUrl('https://example.com', '/img/og.png')).toBe(
			'https://example.com/img/og.png'
		);
	});

	it('resolves a bare relative path against the origin', () => {
		expect(toAbsoluteUrl('https://example.com', 'img/og.png')).toBe(
			'https://example.com/img/og.png'
		);
	});

	it('normalizes the origin before joining', () => {
		expect(toAbsoluteUrl('https://example.com/', '/img/og.png')).toBe(
			'https://example.com/img/og.png'
		);
	});

	it('returns an already-absolute http(s) URL unchanged', () => {
		expect(toAbsoluteUrl('https://example.com', 'https://cdn.other.com/og.png')).toBe(
			'https://cdn.other.com/og.png'
		);
	});
});

describe('findDefaultAlternate', () => {
	const alternates = [
		{ lang: 'en', href: 'https://example.com/en/about' },
		{ lang: 'es', href: 'https://example.com/es/acerca' }
	];

	it('finds the alternate matching defaultLang', () => {
		expect(findDefaultAlternate(alternates, 'en')).toEqual(alternates[0]);
	});

	it('returns undefined when no alternate matches', () => {
		expect(findDefaultAlternate(alternates, 'fr')).toBeUndefined();
	});

	it('returns undefined for an empty alternates array', () => {
		expect(findDefaultAlternate([], 'en')).toBeUndefined();
	});
});
