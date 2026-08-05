<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { docs } from '$lib/docs';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	const entries = docs.navFor('en');
</script>

<div class="docs-layout">
	<nav aria-label="Docs">
		{#each entries as entry (entry.slug)}
			<a href="/{entry.slug}" aria-current={page.data.slug === entry.slug ? 'page' : undefined}>
				{entry.title}
			</a>
		{/each}
	</nav>

	<div class="docs-content">
		{@render children()}
	</div>
</div>
