<script lang="ts">
	let { images }: { images: string[] } = $props();
	// Prev/next controls carry real DaisyUI classes (`btn btn-circle`) plus the plain Tailwind
	// utility `no-underline` (and `hover:no-underline`) to cancel the underline-on-hover a bare
	// `<a>` gets — both compile fine under a zero-config consumer (`@mrmx/chiqui/style.css`),
	// which only needs classes literally used in this file.
</script>

<div class="carousel w-full">
	{#each images as src, i}
		<div id={`items${i + 1}`} class="carousel-item relative w-full">
			<img {src} alt={`image ${i + 1}`} class="w-full h-64 md:h-80 object-contain" />
			<div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
				<a
					href={`#items${i === 0 ? images.length : i}`}
					class="btn btn-circle no-underline hover:no-underline">❮</a
				>
				<a
					href={`#items${i + 2 > images.length ? 1 : i + 2}`}
					class="btn btn-circle no-underline hover:no-underline">❯</a
				>
			</div>
		</div>
	{/each}
</div>
