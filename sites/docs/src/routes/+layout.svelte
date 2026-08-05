<script lang="ts">
	import '@mrmx/chiqui/style.css';
	import { Layout } from '@mrmx/chiqui/components';
	import { getTranslatedSlug } from '$lib/content';

	let { children } = $props();
</script>

<Layout {getTranslatedSlug}>
	{@render children?.()}
</Layout>
