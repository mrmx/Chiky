import { error } from '@sveltejs/kit';
import { docs } from '$lib/docs';
import type { PageLoad } from './$types';

// No prerender/entries() here — this route is served dynamically (adapter-auto), same as
// any other route in this app. That's the point: headless usage doesn't require chiqui's
// static-generation story at all.
//
// This app's whole content is the doc set: the rest param matches bare `/` (zero segments)
// too, which resolves to the default doc — no separate landing page to maintain.
export const load: PageLoad = ({ params }) => {
	const slug = params.slug || docs.defaultSlug;
	if (!docs.hasSlug(slug)) error(404, `No doc at "/${params.slug}".`);
	return { slug };
};
