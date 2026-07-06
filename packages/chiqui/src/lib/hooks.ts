/**
 * SvelteKit `handle` hook helper for chiqui sites.
 *
 * Chiqui sites are fully prerendered, so `app.html` has no per-request templating — the
 * `<html lang>` attribute lives in a static file. To still ship the correct `lang` per page,
 * `app.html` keeps a literal `%lang%` placeholder (SvelteKit's own convention for
 * `%sveltekit.xxx%` tokens) and this handle rewrites it via `transformPageChunk`, deriving
 * the language from the first path segment (e.g. `/es/acerca` -> `es`), falling back to the
 * site's default language for unprefixed/unknown segments.
 *
 * Usage:
 * ```ts
 * // src/app.html
 * <html lang="%lang%">
 *
 * // src/hooks.server.ts
 * import { createLangHandle } from '@mrmx/chiqui/hooks';
 * export const handle = createLangHandle();
 * ```
 */
import type { Handle } from '@sveltejs/kit';
import { defaultLang as getDefaultLang, supportedLangs as getSupportedLangs } from './config.js';

export interface CreateLangHandleOptions {
	/** Overrides the chiqui config's `i18n.defaultLang`. */
	defaultLang?: string;
	/** Overrides the chiqui config's `i18n.supported`. */
	supported?: readonly string[];
}

/**
 * Pure helper: resolves the request language from a pathname's first segment, falling back
 * to `defaultLang` when the segment is missing or isn't in `supported`.
 */
export function resolveLangFromPath(
	pathname: string,
	supported: readonly string[],
	defaultLang: string
): string {
	const seg = pathname.split('/').filter(Boolean)[0];
	return seg && supported.includes(seg) ? seg : defaultLang;
}

/**
 * Creates a SvelteKit `Handle` that rewrites the `%lang%` placeholder in `app.html` with the
 * resolved request language. Reads `defaultLang`/`supported` from the chiqui config
 * (`initConfig()` must have run before a request comes in — importing your site's
 * `$lib/config` from `hooks.server.ts` before this line is enough) unless overridden via
 * `options`.
 */
export function createLangHandle(options: CreateLangHandleOptions = {}): Handle {
	return async ({ event, resolve }) => {
		const defaultLangValue = options.defaultLang ?? getDefaultLang();
		const supported = options.supported ?? getSupportedLangs();
		const lang = resolveLangFromPath(event.url.pathname, supported, defaultLangValue);
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace(/%lang%/g, lang)
		});
	};
}
