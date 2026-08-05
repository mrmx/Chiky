import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createChiquiPreprocessor } from '@mrmx/chiqui/svelte-config';

// This app owns svelte.config.js in full — adapter, kit.*, extensions — same as any plain
// SvelteKit project. Chiqui only lends its content engine to /docs; createChiquiPreprocessor
// is just the mdsvex preprocessor (so `mdsvex` isn't installed here directly), not the whole
// config. adapter-auto (not adapter-static) on purpose: nothing here is prerendered — this
// is the "chiqui inside a dynamic app" story, not the "chiqui owns a static site" one (that's
// sites/docs).
/** @type {import('@sveltejs/kit').Config} */
export default {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), createChiquiPreprocessor()],
	kit: { adapter: adapter() }
};
