<script lang="ts">
	import type { PageProps } from './$types';
	import { Seo } from '@mrmx/chiqui/components';
	import { getHreflangAlternates } from '$lib/content';
	let { data }: PageProps = $props();
	let metadata = $derived(data.metadata);
	let Page = $derived(data.component);
</script>

<Seo
	lang={data.lang}
	slug={data.slug}
	title={metadata?.title}
	description={metadata?.description as string | undefined}
	image={metadata?.image as string | undefined}
	{getHreflangAlternates}
/>

{#if metadata?.title}
	<h1>{metadata.title}</h1>
{/if}

<Page />
