import type { ServerInit } from '@sveltejs/kit';
import { dev } from '$app/environment';
// Import config to trigger initConfig()
import '$lib/config';
import { contents, assertValidIndex } from '$lib/content';
import { createLangHandle } from '@mrmx/chiqui/hooks';

if (dev) {
	console.log(`[chiqui] loaded ${contents.length} content entries`);
}

// Strict by design: an SSG build with invalid content (duplicate ids, missing
// frontmatter, ...) must fail loudly instead of silently shipping broken pages.
export const init: ServerInit = async () => {
	assertValidIndex();
};

// Rewrites the `%lang%` placeholder in app.html to the request's resolved language
// (see src/app.html and @mrmx/chiqui/hooks for details).
export const handle = createLangHandle();
