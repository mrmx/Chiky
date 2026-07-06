import { describe, it, expect, vi } from 'vitest';
import { resolveLangFromPath, createLangHandle } from '../src/lib/hooks.js';

// ---------------------------------------------------------------------------
// resolveLangFromPath
// ---------------------------------------------------------------------------
describe('resolveLangFromPath', () => {
	it('resolves a supported lang from the first path segment', () => {
		expect(resolveLangFromPath('/es/acerca', ['en', 'es'], 'en')).toBe('es');
	});

	it('falls back to defaultLang when the first segment is unsupported', () => {
		expect(resolveLangFromPath('/fr/about', ['en', 'es'], 'en')).toBe('en');
	});

	it('falls back to defaultLang for the bare root path', () => {
		expect(resolveLangFromPath('/', ['en', 'es'], 'en')).toBe('en');
	});

	it('falls back to defaultLang for an empty path', () => {
		expect(resolveLangFromPath('', ['en', 'es'], 'en')).toBe('en');
	});

	it('resolves the lang for a nested path', () => {
		expect(resolveLangFromPath('/es/guide/intro', ['en', 'es'], 'en')).toBe('es');
	});

	it('resolves the lang when it is itself the defaultLang', () => {
		expect(resolveLangFromPath('/en/about', ['en', 'es'], 'en')).toBe('en');
	});
});

// ---------------------------------------------------------------------------
// createLangHandle
// ---------------------------------------------------------------------------
function makeEvent(pathname: string) {
	return { url: new URL(`https://example.com${pathname}`) };
}

describe('createLangHandle', () => {
	it('rewrites %lang% using the resolved lang from an explicit supported/defaultLang option', async () => {
		const handle = createLangHandle({ defaultLang: 'en', supported: ['en', 'es'] });
		const resolve = vi.fn(async (_event, opts) => {
			const html = opts.transformPageChunk({ html: '<html lang="%lang%"><body></body></html>' });
			return new Response(html);
		});

		const response = await handle({ event: makeEvent('/es/acerca'), resolve } as any);
		const text = await response.text();

		expect(text).toBe('<html lang="es"><body></body></html>');
		expect(resolve).toHaveBeenCalledTimes(1);
	});

	it('falls back to the provided defaultLang for an unsupported/missing segment', async () => {
		const handle = createLangHandle({ defaultLang: 'en', supported: ['en', 'es'] });
		const resolve = vi.fn(async (_event, opts) => {
			const html = opts.transformPageChunk({ html: '<html lang="%lang%"></html>' });
			return new Response(html);
		});

		const response = await handle({ event: makeEvent('/'), resolve } as any);
		expect(await response.text()).toBe('<html lang="en"></html>');
	});

	it('replaces every %lang% occurrence, not just the first', async () => {
		const handle = createLangHandle({ defaultLang: 'en', supported: ['en', 'es'] });
		const resolve = vi.fn(async (_event, opts) => {
			const html = opts.transformPageChunk({
				html: '<html lang="%lang%"><meta content="%lang%" /></html>'
			});
			return new Response(html);
		});

		const response = await handle({ event: makeEvent('/es/docs'), resolve } as any);
		expect(await response.text()).toBe('<html lang="es"><meta content="es" /></html>');
	});

	it('reads defaultLang/supported from the chiqui config when no options are given', async () => {
		vi.resetModules();
		const { initConfig } = await import('../src/lib/config.js');
		const { createLangHandle: freshCreateLangHandle } = await import('../src/lib/hooks.js');

		initConfig({
			site: { name: 'Test' },
			i18n: { defaultLang: 'en', supported: ['en', 'es'] },
			nav: { header: { show: false }, footer: { show: false } }
		});

		const handle = freshCreateLangHandle();
		const resolve = vi.fn(async (_event, opts) => {
			const html = opts.transformPageChunk({ html: '<html lang="%lang%"></html>' });
			return new Response(html);
		});

		const response = await handle({ event: makeEvent('/es/acerca'), resolve } as any);
		expect(await response.text()).toBe('<html lang="es"></html>');
	});
});
