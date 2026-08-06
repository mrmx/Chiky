import { describe, it, expect } from 'vitest';
import { createChiquiPreprocessor, createSvelteConfig } from '../src/lib/svelte-config.js';

// Fake adapter/vitePreprocess — these are opaque to chiqui (it just forwards the call
// results), so a marker object is enough to prove they're wired through untouched.
const fakeAdapter = () => ({ name: 'fake-adapter' }) as any;
const fakeVitePreprocess = () => ({ name: 'fake-vite-preprocess' }) as any;

describe('createChiquiPreprocessor', () => {
	it('returns a preprocessor (mdsvex is applied, not just referenced)', () => {
		const preprocessor = createChiquiPreprocessor();
		expect(preprocessor).toBeDefined();
		expect(typeof preprocessor).toBe('object');
	});

	it('accepts custom options without throwing (e.g. a layout wrapper path)', () => {
		expect(() =>
			createChiquiPreprocessor({ extensions: ['.md'], layout: { _: './DocArticle.svelte' } })
		).not.toThrow();
	});
});

describe('createSvelteConfig', () => {
	it('wires the given adapter into kit.adapter', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess);
		expect(config.kit?.adapter).toEqual({ name: 'fake-adapter' });
	});

	it('includes vitePreprocess and an mdsvex preprocessor, in that order', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess);
		// `Config['preprocess']` is `Arrayable<PreprocessorGroup>` (not always an array), but
		// createSvelteConfig always builds it as one — a cast documents that assumption here.
		const preprocess = config.preprocess as unknown[];
		expect(preprocess).toHaveLength(2);
		expect(preprocess[0]).toEqual({ name: 'fake-vite-preprocess' });
	});

	it('defaults extensions to .svelte + .md', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess);
		expect(config.extensions).toEqual(['.svelte', '.md']);
	});

	it('derives extensions from a custom mdsvexOptions.extensions instead of hardcoding .md', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
			mdsvexOptions: { extensions: ['.md', '.svx'] }
		});
		expect(config.extensions).toEqual(['.svelte', '.md', '.svx']);
	});

	it('always aliases $config, merging in any extra aliases', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
			aliases: { $i18n: 'src/i18n' }
		});
		expect(config.kit?.alias).toEqual({
			$config: './config.ts',
			$i18n: 'src/i18n'
		});
	});

	it('extra aliases can override $config if a consumer really wants to', () => {
		const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
			aliases: { $config: './elsewhere.ts' }
		});
		expect(config.kit?.alias?.$config).toBe('./elsewhere.ts');
	});

	describe('overrides', () => {
		it('replaces a top-level key outright (e.g. extensions)', () => {
			const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
				overrides: { extensions: ['.svelte', '.custom'] }
			});
			expect(config.extensions).toEqual(['.svelte', '.custom']);
		});

		it('replaces preprocess outright — the seam for swapping mdsvex out entirely', () => {
			const customPreprocess = [{ name: 'totally-different-pipeline' }] as any;
			const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
				overrides: { preprocess: customPreprocess }
			});
			expect(config.preprocess).toBe(customPreprocess);
		});

		it('merges kit.alias instead of replacing it, so $config/aliases survive', () => {
			const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
				aliases: { $i18n: 'src/i18n' },
				overrides: { kit: { alias: { $zenstack: 'src/lib/zenstack' } } }
			});
			expect(config.kit?.alias).toEqual({
				$config: './config.ts',
				$i18n: 'src/i18n',
				$zenstack: 'src/lib/zenstack'
			});
		});

		it('replaces other kit.* fields (e.g. env) without dropping kit.adapter', () => {
			const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
				overrides: { kit: { env: { publicPrefix: 'PUBLIC_' } } }
			});
			expect(config.kit?.env).toEqual({ publicPrefix: 'PUBLIC_' });
			expect(config.kit?.adapter).toEqual({ name: 'fake-adapter' });
		});

		it('wins over aliases/mdsvexOptions when both touch the same thing', () => {
			const config = createSvelteConfig(fakeAdapter, fakeVitePreprocess, {
				mdsvexOptions: { extensions: ['.md'] },
				overrides: { extensions: ['.svelte', '.md', '.svx'] }
			});
			expect(config.extensions).toEqual(['.svelte', '.md', '.svx']);
		});
	});
});
