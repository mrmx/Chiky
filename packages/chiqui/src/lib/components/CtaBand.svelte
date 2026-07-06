<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children
	}: {
		title: string;
		subtitle?: string;
		/** Slot for action buttons, e.g. `{#snippet children()}<a class="btn btn-primary">...</a>{/snippet}` */
		children?: Snippet;
	} = $props();
</script>

<section class="bg-base-200 flex flex-col items-center gap-4 rounded-box p-10 text-center">
	<h2 class="text-3xl font-bold">{title}</h2>
	{#if subtitle}
		<p class="text-base-content/70 max-w-2xl">{subtitle}</p>
	{/if}
	{#if children}
		<div class="mt-2 flex flex-wrap justify-center gap-3">
			{@render children()}
		</div>
	{/if}
</section>
