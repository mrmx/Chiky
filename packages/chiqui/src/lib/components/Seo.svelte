<script lang="ts">
	import { page } from '$app/state';
	import { siteName, defaultLang, siteUrl } from '$lib/config';
	import {
		normalizeOrigin,
		buildCanonicalPath,
		buildPageTitle,
		toAbsoluteUrl,
		findDefaultAlternate,
		type HreflangAlternate
	} from '$lib/seo';

	let {
		lang,
		slug,
		title,
		description,
		image,
		origin,
		getHreflangAlternates
	}: {
		/** Current page's language (e.g. 'en') */
		lang: string;
		/** Current page's slug, '' for the language root/home page */
		slug: string;
		/** Page title; rendered as `siteName — title` (falls back to just `siteName`) */
		title?: string;
		description?: string;
		/** Social preview image; relative paths are resolved against the resolved origin */
		image?: string;
		/** Overrides the origin used for canonical/hreflang/OG URLs (falls back to `site.url`, then `page.url.origin`) */
		origin?: string;
		/** Injected the same way `Header` takes `getTranslatedSlug` — the content store's alternates lookup */
		getHreflangAlternates?: (lang: string, slug: string, origin: string) => HreflangAlternate[];
	} = $props();

	let resolvedOrigin = $derived(normalizeOrigin(origin ?? siteUrl() ?? page.url.origin));
	let pageTitle = $derived(buildPageTitle(siteName(), title));
	let canonicalHref = $derived(`${resolvedOrigin}${buildCanonicalPath(lang, slug)}`);
	let alternates = $derived(getHreflangAlternates?.(lang, slug, resolvedOrigin) ?? []);
	let defaultAlternate = $derived(findDefaultAlternate(alternates, defaultLang()));
	let absoluteImage = $derived(image ? toAbsoluteUrl(resolvedOrigin, image) : undefined);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}

	<link rel="canonical" href={canonicalHref} />
	{#each alternates as alt (alt.lang)}
		<link rel="alternate" hreflang={alt.lang} href={alt.href} />
	{/each}
	{#if defaultAlternate}
		<link rel="alternate" hreflang="x-default" href={defaultAlternate.href} />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName()} />
	<meta property="og:title" content={pageTitle} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if absoluteImage}
		<meta property="og:image" content={absoluteImage} />
	{/if}
	<meta property="og:locale" content={lang} />

	<meta name="twitter:card" content={absoluteImage ? 'summary_large_image' : 'summary'} />
</svelte:head>
