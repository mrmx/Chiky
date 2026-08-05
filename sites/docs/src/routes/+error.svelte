<script lang="ts">
	import { page } from '$app/state';
	import { siteName } from '$lib/config';
</script>

<svelte:head>
	<title>{siteName()} — {page.status}</title>
</svelte:head>

<div class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Page not found.'}</p>
	<a href="/">Back to home</a>
</div>

<style>
	.error-page {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.75rem;
	}

	h1 {
		font-size: 3.5rem;
		font-weight: bold;
		margin: 0;
	}

	p {
		opacity: 0.7;
		margin: 0;
	}

	a {
		margin-top: 0.5rem;
		color: var(--color-primary);
	}
</style>
