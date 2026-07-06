import type { ServerInit } from '@sveltejs/kit';
import { dev } from '$app/environment';
// Import config to trigger initConfig()
import '$lib/config';
import { contents, assertValidIndex } from '$lib/content';

if (dev) {
	console.log(`[chiqui] loaded ${contents.length} content entries`);
}

// Strict by design: an SSG build with invalid content (duplicate ids, missing
// frontmatter, ...) must fail loudly instead of silently shipping broken pages.
export const init: ServerInit = async () => {
	assertValidIndex();
};
