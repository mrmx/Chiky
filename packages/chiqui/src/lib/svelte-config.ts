/**
 * SvelteKit config helper for chiqui sites.
 *
 * Chiqui is a static site generator: consumers are expected to pass
 * `@sveltejs/adapter-static` (not `adapter-auto`) so `pnpm build` emits plain HTML/CSS/JS
 * with no Node server required. Prerendering itself is opt-in per site — add
 * `export const prerender = true;` to `src/routes/+layout.ts` and export an `entries()`
 * function from any dynamic route (see `contentEntries()` in `@mrmx/chiqui/content`) so
 * adapter-static knows which URLs to generate.
 *
 * Usage in your site's svelte.config.js:
 * ```js
 * import adapter from '@sveltejs/adapter-static';
 * import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
 * import { mdsvex } from 'mdsvex';
 * import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';
 *
 * export default createSvelteConfig(adapter, vitePreprocess, mdsvex);
 * ```
 */
import type { Adapter, Config } from '@sveltejs/kit';

export interface ChiquiSvelteConfigOptions {
	/** Extra aliases beyond $config */
	aliases?: Record<string, string>;
}

/**
 * Creates a standard SvelteKit config for chiqui sites.
 * Must be called in svelte.config.js where adapter/preprocessors are available.
 *
 * The adapter instance is created by (and remains the responsibility of) the consumer —
 * this function just wires it into `kit.adapter`. Pass `@sveltejs/adapter-static` for a
 * fully static site; no extra `fallback`/`strict` options are required here as long as the
 * consumer prerenders every route it wants generated (see the module doc above).
 *
 * `vitePreprocess` and `mdsvex` are typed against `@sveltejs/vite-plugin-svelte` and
 * `mdsvex` respectively — both are devDependencies here purely for their type
 * declarations (type-only imports are erased at build time); the actual functions are
 * always supplied by the consumer, who already depends on both packages directly.
 */
export function createSvelteConfig(
	adapter: () => Adapter,
	vitePreprocess: typeof import('@sveltejs/vite-plugin-svelte').vitePreprocess,
	mdsvex: typeof import('mdsvex').mdsvex,
	options: ChiquiSvelteConfigOptions = {}
): Config {
	const mdsvexOptions = { extensions: ['.md'] };

	return {
		preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
		kit: {
			adapter: adapter(),
			alias: {
				$config: './config.ts',
				...options.aliases
			}
		},
		extensions: ['.svelte', '.svx', '.md']
	};
}
