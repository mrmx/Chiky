import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, mergeConfig } from 'vite';
import { chiquiViteConfig } from '@mrmx/chiqui/vite';

// No Tailwind plugin: this site uses @mrmx/chiqui/style.css (Option A, zero config) for
// @mrmx/chiqui/components, plus its own plain hand-written CSS (in +layout.svelte's <style>
// block) for its own page shell — see the README's "Styling @mrmx/chiqui/components" section.
export default defineConfig(
	mergeConfig(chiquiViteConfig(), {
		plugins: [sveltekit()]
	})
);
