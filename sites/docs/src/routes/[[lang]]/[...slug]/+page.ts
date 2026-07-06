import { error } from '@sveltejs/kit';
import { getContent, contentEntries } from '$lib/content';
import { defaultLang } from '$lib/config';

// Tells adapter-static which lang/slug combinations to prerender for this dynamic route.
// contentEntries() covers every `/{lang}/{slug}` page (e.g. /en/about, /es/acerca). The root
// `/` isn't among them since it needs an empty lang segment, so we add it explicitly: '/' and
// '/{defaultLang}' both resolve to the same defaultLang home entry via load() below.
export function entries() {
	return [{ lang: '', slug: '' }, ...contentEntries()];
}

export function load({ params }) {
	let { lang = '', slug } = params;
	if (lang === '') {
		lang = defaultLang();
	}
	const entry = getContent(lang, slug);
	if (!entry) {
		throw error(404, 'Not found');
	}

	return {
		lang,
		slug,
		metadata: entry.metadata,
		component: entry.component
	};
}
