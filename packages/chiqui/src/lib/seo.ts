// Pure URL/string helpers backing the `<Seo>` component (see `components/Seo.svelte`).
// Kept dependency-free and framework-agnostic so they're cheap to unit test without
// rendering the component (Svelte component rendering isn't set up in this package's
// test harness — see tests/seo.test.ts).

export type HreflangAlternate = { lang: string; href: string };

/** Strips any trailing slash(es) from an origin/base URL. */
export function normalizeOrigin(origin: string): string {
	return origin.replace(/\/+$/, '');
}

/**
 * Builds the canonical path for a `{lang}/{slug}` page. Unlike
 * `ContentStore#getHreflangAlternates` (which templates `${lang}/${slug}` verbatim and so
 * produces a trailing slash for empty-slug/home entries, e.g. `/en/`), this always returns
 * the clean path that actually gets prerendered (`/en`, `/en/about`) — no trailing slash.
 */
export function buildCanonicalPath(lang: string, slug: string): string {
	return slug ? `/${lang}/${slug}` : `/${lang}`;
}

/** `siteName — title`, or just `siteName` when there's no page title. */
export function buildPageTitle(siteName: string, title?: string): string {
	return title ? `${siteName} — ${title}` : siteName;
}

/** Resolves `path` to an absolute URL against `origin` (a no-op if already absolute). */
export function toAbsoluteUrl(origin: string, path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	const base = normalizeOrigin(origin);
	return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** Finds the alternate matching `defaultLang` (used to build the `x-default` hreflang link). */
export function findDefaultAlternate(
	alternates: HreflangAlternate[],
	defaultLang: string
): HreflangAlternate | undefined {
	return alternates.find((a) => a.lang === defaultLang);
}
