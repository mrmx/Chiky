<script lang="ts">
	import { docs } from '$lib/docs';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const doc = $derived(docs.resolve('en', data.slug));
	const neighbors = $derived(docs.neighbors('en', data.slug));
</script>

{#if doc}
	{@const Doc = doc.component}
	<article>
		<h1>{doc.metadata.title}</h1>
		{#if doc.metadata.description}<p>{doc.metadata.description}</p>{/if}
		<Doc />
	</article>

	<nav>
		{#if neighbors.previous}<a href="/{neighbors.previous.slug}">← {neighbors.previous.title}</a>{/if}
		{#if neighbors.next}<a href="/{neighbors.next.slug}">{neighbors.next.title} →</a>{/if}
	</nav>
{/if}
