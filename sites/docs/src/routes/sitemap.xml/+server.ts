import { generateSitemapXml } from '@mrmx/chiqui/sitemap';
import { contents, getHreflangAlternates } from '$lib/content';
import { siteUrl, defaultLang } from '$lib/config';

// Static endpoint (no route params), so adapter-static prerenders it without needing an
// `entries()` export — see AGENTS.md's prerender notes.
export const prerender = true;

export function GET() {
	const xml = generateSitemapXml(
		{ contents, getHreflangAlternates },
		siteUrl() ?? 'http://localhost',
		{ defaultLang: defaultLang() }
	);

	return new Response(xml, {
		headers: { 'content-type': 'application/xml' }
	});
}
