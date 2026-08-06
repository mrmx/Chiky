<script lang="ts">
	import type { Snippet } from 'svelte';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import { showHeader, showFooter } from '$lib/config';

	// Pre-built page shell for a zero-config consumer that wants the whole site (not just
	// `<Header>`/`<Footer>` as loose pieces to compose themselves — see the README's Quick
	// Start "Layout" section for that lower-level option, still available for a site that
	// wants its own page structure or only embeds chiqui in part of a larger app). This is
	// the sticky-footer shell: `<Header>` on top, `<Footer>` (if enabled) pinned to the
	// bottom, and a scrollable `<main>` in between wrapped in `prose` for Markdown content —
	// all as plain DaisyUI/Tailwind classes on this component's own markup, so it compiles
	// into `@mrmx/chiqui/style.css` like the rest of chiqui's components.
	let {
		getTranslatedSlug,
		children
	}: {
		getTranslatedSlug?: (
			currentLang: string,
			currentSlug: string,
			targetLang: string
		) => string | null;
		children: Snippet;
	} = $props();
</script>

<div class="flex min-h-screen w-full flex-col overflow-hidden">
	{#if showHeader()}
		<Header {getTranslatedSlug} />
	{/if}

	<main class="min-h-0 flex-1 overflow-auto">
		<div
			class="prose prose-neutral dark:prose-invert mx-auto max-w-none px-4 py-6 sm:px-6 lg:max-w-5xl lg:px-8"
		>
			{@render children()}
		</div>
	</main>

	{#if showFooter()}
		<Footer />
	{/if}
</div>
