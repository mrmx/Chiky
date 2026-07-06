<script lang="ts">
	import { page } from '$app/state';
	import { siteName } from '$lib/config';
</script>

<svelte:head>
	<title>{siteName()} — {page.status}</title>
</svelte:head>

<div class="hero min-h-[60vh]">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-6xl font-bold">{page.status}</h1>
			<p class="py-4 opacity-70">{page.error?.message ?? 'Page not found.'}</p>
			<a href="/" class="btn btn-primary">Back to home</a>
		</div>
	</div>
</div>
