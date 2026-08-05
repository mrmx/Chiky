/**
 * SvelteKit config helpers for chiqui sites.
 *
 * Chiqui *is* an mdsvex content pipeline (see the package description), so `mdsvex` is a
 * real (non-dev) dependency of `@mrmx/chiqui` — the consumer never installs or imports
 * `mdsvex` directly. This differs from `adapter` and `vitePreprocess`, which stay
 * consumer-supplied on purpose: the adapter is a per-site choice (static vs. node vs. auto,
 * see below) and `vitePreprocess` is a base SvelteKit concern unrelated to the content
 * pipeline, already a dependency of any SvelteKit project regardless of Chiqui.
 *
 * Two exports, two amounts of opinion:
 *
 * - **`createChiquiPreprocessor(options?)`** — just the mdsvex preprocessor, already
 *   imported and callable. For a consumer that owns its own `svelte.config.js` in full
 *   (its own adapter/kit/alias/extensions — e.g. one otherwise-dynamic app embedding a
 *   Chiqui-powered docs section, see the README's "Headless usage") and wants nothing more
 *   from Chiqui than "don't make me depend on mdsvex directly for this one preprocessor".
 * - **`createSvelteConfig(adapter, vitePreprocess, options?)`** — the whole config object
 *   (preprocess + adapter + alias + extensions), built on top of
 *   `createChiquiPreprocessor`. For a consumer that wants Chiqui's full opinion on
 *   `svelte.config.js`, not just the mdsvex piece — typically a site Chiqui owns end to end
 *   (see the README's Quick Start). Reaching for this from an app where Chiqui only powers
 *   one section makes the *entire* app's SvelteKit config depend on Chiqui's opinion of
 *   `kit.adapter`/`kit.alias`/`extensions`, for the sake of one section — prefer
 *   `createChiquiPreprocessor` there instead. Not locked into chiqui's exact shape either
 *   way: `options.overrides` is merged over the generated config last (`kit.alias` merges,
 *   everything else replaces outright), so anything `aliases`/`mdsvexOptions` don't cover —
 *   extra `kit.*` fields, a fully custom `preprocess` pipeline instead of mdsvex, custom
 *   `extensions` — is still reachable without forking the function.
 *
 * The adapter is a parameter, not a Chiqui decision: for a fully static site pass
 * `@sveltejs/adapter-static` and `pnpm build` emits plain HTML/CSS/JS with no Node server
 * required. Prerendering itself is opt-in per route regardless of adapter — add
 * `export const prerender = true;` to `src/routes/+layout.ts` (or a single route) and
 * export an `entries()` function from any dynamic route (see `contentEntries()` in
 * `@mrmx/chiqui/content`) so the adapter knows which URLs to generate.
 *
 * Usage in your site's svelte.config.js (Chiqui owns the whole config):
 * ```js
 * import adapter from '@sveltejs/adapter-static';
 * import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
 * import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';
 *
 * export default createSvelteConfig(adapter, vitePreprocess);
 * ```
 *
 * Usage when you own `svelte.config.js` yourself (just the mdsvex piece):
 * ```js
 * import adapter from '@sveltejs/adapter-auto';
 * import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
 * import { createChiquiPreprocessor } from '@mrmx/chiqui/svelte-config';
 *
 * export default {
 *   extensions: ['.svelte', '.md'],
 *   preprocess: [vitePreprocess(), createChiquiPreprocessor({ extensions: ['.md'] })],
 *   kit: { adapter: adapter(), alias: { ... } }
 * };
 * ```
 */
import type { Adapter, Config } from '@sveltejs/kit';
import type { PreprocessorGroup } from 'svelte/compiler';
import { mdsvex, type MdsvexOptions } from 'mdsvex';

const defaultMdsvexOptions: MdsvexOptions = { extensions: ['.md'] };

/**
 * Returns chiqui's markdown preprocessor (mdsvex under the hood, wired for you — `mdsvex`
 * isn't a parameter here, see the module doc above for why). Defaults to
 * `{ extensions: ['.md'] }`; pass your own `MdsvexOptions` (whole object, not merged) for a
 * layout wrapper, custom `extensions`, or remark/rehype plugins.
 *
 * Typed as the public `PreprocessorGroup` (from `svelte/compiler`) rather than mdsvex's own
 * `Preprocessor` return type, which isn't exported from its type declarations and can't be
 * named in ours.
 */
export function createChiquiPreprocessor(options?: MdsvexOptions): PreprocessorGroup {
	return mdsvex(options ?? defaultMdsvexOptions);
}

export interface ChiquiSvelteConfigOptions {
	/** Extra aliases beyond $config */
	aliases?: Record<string, string>;
	/** Forwarded to {@link createChiquiPreprocessor} as-is. */
	mdsvexOptions?: MdsvexOptions;
	/**
	 * Escape hatch for anything `aliases`/`mdsvexOptions` don't cover — merged over chiqui's
	 * generated config last, so it wins over every chiqui default (`kit.adapter` aside, which
	 * always reflects the `adapter` argument). Top-level keys (`extensions`, `preprocess`,
	 * `compilerOptions`, `onwarn`, `vitePlugin`, ...) replace chiqui's default outright — pass
	 * your own `preprocess` array here to swap mdsvex out for a different pipeline entirely,
	 * or your own `extensions` to control exactly which ones SvelteKit treats as components.
	 * `kit.alias` is the one exception: merged instead of replaced, so this doesn't force you
	 * to repeat `$config`/`aliases` here too. Other `kit.*` keys (`env`, `files`, `csp`, ...)
	 * replace chiqui's default for that key, same as any top-level key.
	 */
	overrides?: Partial<Config>;
}

/**
 * Creates a standard SvelteKit config for chiqui sites.
 * Must be called in svelte.config.js where adapter/vitePreprocess are available.
 *
 * The adapter instance is created by (and remains the responsibility of) the consumer —
 * this function just wires it into `kit.adapter`. Pass `@sveltejs/adapter-static` for a
 * fully static site; no extra `fallback`/`strict` options are required here as long as the
 * consumer prerenders every route it wants generated (see the module doc above).
 *
 * `vitePreprocess` is typed against `@sveltejs/vite-plugin-svelte` and supplied by the
 * consumer, who already depends on it directly (every SvelteKit project does). `mdsvex`
 * itself is not a parameter — see the module doc above for why. Anything this function's
 * own options (`aliases`, `mdsvexOptions`) don't cover — see `overrides`.
 */
export function createSvelteConfig(
	adapter: () => Adapter,
	vitePreprocess: typeof import('@sveltejs/vite-plugin-svelte').vitePreprocess,
	options: ChiquiSvelteConfigOptions = {}
): Config {
	const mdsvexOptions = options.mdsvexOptions ?? defaultMdsvexOptions;
	const mdsvexExtensions = mdsvexOptions.extensions ?? ['.md'];
	const { overrides = {} } = options;

	const base: Config = {
		preprocess: [vitePreprocess(), createChiquiPreprocessor(mdsvexOptions)],
		kit: {
			adapter: adapter(),
			alias: {
				$config: './config.ts',
				...options.aliases
			}
		},
		extensions: ['.svelte', ...mdsvexExtensions]
	};

	return {
		...base,
		...overrides,
		kit: {
			...base.kit,
			...overrides.kit,
			alias: {
				...base.kit?.alias,
				...overrides.kit?.alias
			}
		}
	};
}
