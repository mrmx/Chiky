<script lang="ts">
	import { page } from '$app/state';
	import { headerNavItems, isGroup, defaultLang, supportedLangs } from '$lib/config';
	import type { NavNode } from '$lib/config';
	import LightDarkMode from './LightDarkMode/LightDarkMode.svelte';
	import NavLink from './NavLink.svelte';
	import LanguageSelect from './LanguageSelect.svelte';
	import SiteLogo from './SiteLogo.svelte';

	let {
		getTranslatedSlug
	}: {
		getTranslatedSlug?: (
			currentLang: string,
			currentSlug: string,
			targetLang: string
		) => string | null;
	} = $props();

	let currentLang = $derived(page.params.lang || defaultLang());
	let currentPath = $derived(page.url.pathname);
	const langs = supportedLangs();
	const navEntries = $derived.by(() => headerNavItems(currentLang));
</script>

{#snippet navItem(node: NavNode)}
	<li>
		{#if isGroup(node)}
			<details>
				<summary>{node.title ?? node.name}</summary>
				<ul class="bg-base-100 rounded-box z-10 p-2 shadow-2xl border border-base-300">
					{#each node.items as child}
						{@render navItem(child)}
					{/each}
				</ul>
			</details>
		{:else}
			<NavLink {node} class={currentPath === node.href ? 'font-bold text-secondary' : ''} />
		{/if}
	</li>
{/snippet}

<header class="navbar bg-base-100 shadow-md transition-all duration-300">
	<div class="flex-none">
		<SiteLogo />
	</div>
	<div class="flex-auto"></div>
	<div class="flex gap-2 items-center">
		<ul class="menu menu-horizontal px-1 hidden lg:flex">
			{#each navEntries as entry}
				{@render navItem(entry)}
			{/each}
		</ul>

		{#if langs.length > 1}
			<LanguageSelect lang={currentLang} {getTranslatedSlug} />
		{/if}

		<LightDarkMode />
	</div>
</header>
