/**
 * sitemap.xml generator for chiqui sites.
 *
 * Builds a `urlset` with one `<url>` per content entry, annotated with
 * `<xhtml:link rel="alternate" hreflang="...">` per translation (sourced from a
 * `ContentStore`'s `getHreflangAlternates`, Google's recommended way to declare
 * multilingual URL alternates in a sitemap) plus an optional `x-default` link.
 *
 * Usage in `src/routes/sitemap.xml/+server.ts`:
 * ```ts
 * import { generateSitemapXml } from '@mrmx/chiqui/sitemap';
 * import { contents, getHreflangAlternates } from '$lib/content';
 * import { siteUrl, defaultLang } from '$lib/config';
 *
 * export const prerender = true;
 *
 * export function GET() {
 *   const xml = generateSitemapXml(
 *     { contents, getHreflangAlternates },
 *     siteUrl() ?? 'https://example.com',
 *     { defaultLang: defaultLang() }
 *   );
 *   return new Response(xml, { headers: { 'content-type': 'application/xml' } });
 * }
 * ```
 */
import { buildCanonicalPath, normalizeOrigin, type HreflangAlternate } from './seo.js';

export interface SitemapContentEntry {
	lang: string;
	slug: string;
}

/**
 * The minimal slice of `ContentStore` this generator needs — a structural (not nominal)
 * type, so passing the full `ContentStore` returned by `createContent()` works as-is, but
 * callers aren't forced to depend on the whole shape.
 */
export interface SitemapContentStore {
	contents: SitemapContentEntry[];
	getHreflangAlternates: (lang: string, slug: string, origin: string) => HreflangAlternate[];
}

export interface GenerateSitemapOptions {
	/** If provided and an alternate exists for it, adds an `hreflang="x-default"` link. */
	defaultLang?: string;
}

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Builds a sitemap.xml `urlset` string for every entry in `store.contents`.
 *
 * NOTE: `getHreflangAlternates` templates hrefs as `${origin}/${lang}/${slug}`, which yields
 * a trailing slash for empty-slug/home entries (e.g. `/en/`) even though the actual
 * prerendered file is served at `/en` (no trailing slash) — a preexisting quirk of that
 * helper (see `content.ts`), left untouched per GOAL-05's scope. `<loc>` reuses the same
 * alternate (so it stays consistent with the hreflang links below it) and only falls back to
 * the clean `buildCanonicalPath()` when no self-alternate is found.
 */
export function generateSitemapXml(
	store: SitemapContentStore,
	origin: string,
	options: GenerateSitemapOptions = {}
): string {
	const base = normalizeOrigin(origin);

	const urlBlocks = store.contents.map(({ lang, slug }) => {
		const alternates = store.getHreflangAlternates(lang, slug, base);
		const self = alternates.find((a) => a.lang === lang);
		const loc = self?.href ?? `${base}${buildCanonicalPath(lang, slug)}`;

		const linkLines = alternates.map(
			(a) =>
				`\t\t<xhtml:link rel="alternate" hreflang="${xmlEscape(a.lang)}" href="${xmlEscape(a.href)}" />`
		);

		if (options.defaultLang) {
			const def = alternates.find((a) => a.lang === options.defaultLang);
			if (def) {
				linkLines.push(
					`\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(def.href)}" />`
				);
			}
		}

		return ['\t<url>', `\t\t<loc>${xmlEscape(loc)}</loc>`, ...linkLines, '\t</url>'].join('\n');
	});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urlBlocks,
		'</urlset>'
	].join('\n');
}
