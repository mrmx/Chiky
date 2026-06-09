<script lang="ts">
	import { page } from '$app/stores';
	import { headerNavItems, isLink, defaultLang, supportedLangs } from '$lib/config';
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

	let currentLang = $derived($page.params.lang || defaultLang());
	let currentPath = $derived($page.url.pathname);
	const langs = supportedLangs();
	const navEntries = $derived.by(() => headerNavItems(currentLang).filter(isLink));
</script>

<header class="navbar bg-base-100 shadow-md transition-all duration-300">
	<div class="flex-none">
		<SiteLogo />
	</div>
	<div class="flex-auto"></div>
	<div class="flex gap-2 items-center">
		<ul class="menu menu-horizontal px-1 hidden lg:flex">
			{#each navEntries as entry}
				<li>
					<NavLink
						node={entry}
						class={currentPath === entry.href ? 'font-bold text-secondary' : ''}
					/>
				</li>
			{/each}
		</ul>

		{#if langs.length > 1}
			<LanguageSelect lang={currentLang} {getTranslatedSlug} />
		{/if}

		<LightDarkMode />
	</div>
</header>
