<script lang="ts">
	import { isVideoSrc, type MediaItem } from '$lib/media';

	let { items }: { items: MediaItem[] } = $props();
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each items as item (item.src)}
		<figure class="m-0 flex flex-col items-center gap-2">
			<div
				class="bg-base-200 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-box"
			>
				{#if isVideoSrc(item.src)}
					<video
						src={item.src}
						autoplay
						muted
						loop
						playsinline
						preload="metadata"
						aria-label={item.alt}
						class="h-full w-full object-contain"
					></video>
				{:else}
					<img
						src={item.src}
						alt={item.alt}
						loading="lazy"
						class="h-full w-full object-contain !max-w-full"
					/>
				{/if}
			</div>
			{#if item.caption}
				<figcaption class="text-base-content/70 text-center text-sm">{item.caption}</figcaption>
			{/if}
		</figure>
	{/each}
</div>
