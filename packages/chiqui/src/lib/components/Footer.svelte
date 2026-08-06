<script lang="ts">
	import { siteCopyright, footerNavItems, isGroup, defaultLang } from '$lib/config';
	import NavLink from './NavLink.svelte';
	import SiteLogo from './SiteLogo.svelte';

	const COPYRIGHT = siteCopyright();
	const YEAR = new Date().getFullYear();

	let { lang = defaultLang() } = $props();

	let navItems = $derived(footerNavItems(lang));
</script>

<footer class="footer sm:footer-horizontal bg-base-200 text-base-content border-base-300 border-t p-10">
	<aside class="self-center text-center sm:text-left">
		<SiteLogo />
		<p class="mt-4 text-sm opacity-60">&copy; {YEAR} {COPYRIGHT}. All rights reserved.</p>
	</aside>
	{#each navItems as item}
		{#if isGroup(item)}
			<nav>
				<h6 class="footer-title">{item.title ?? item.name}</h6>
				<div class="flex flex-col gap-1">
					{#each item.items as child}
						<NavLink node={child} />
					{/each}
				</div>
			</nav>
		{:else}
			<NavLink node={item} />
		{/if}
	{/each}
</footer>
