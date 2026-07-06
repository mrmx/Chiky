import type { ContentEntry } from './types.js';

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
