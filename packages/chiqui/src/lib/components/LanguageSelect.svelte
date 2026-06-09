<script lang="ts">
	import { supportedLangs, defaultLang } from '$lib/config';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	let {
		lang,
		getTranslatedSlug
	}: {
		lang?: string;
		getTranslatedSlug?: (
			currentLang: string,
			currentSlug: string,
			targetLang: string
		) => string | null;
	} = $props();

	let currentLang = $derived(page.params.lang || lang || defaultLang());
	const langs = supportedLangs();

	function changeLanguage(newLang: string) {
		if (newLang === currentLang) return;

		const currentSlug = page.params.slug || '';
		const translatedSlug = getTranslatedSlug?.(currentLang, currentSlug, newLang) ?? '';
		const newPath = `/${newLang}/${translatedSlug}`.replace(/\/+$/, '');
		goto(newPath || `/${newLang}`);
	}
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-ghost rounded-btn border border-base-300">
		<Icon icon="material-symbols-light:language" class="text-lg" />
		<span class="ml-2 uppercase text-xs font-bold">{currentLang}</span>
	</div>
	<ul
		tabindex="-1"
		class="menu dropdown-content bg-base-100 rounded-box z-[10] mt-4 w-40 p-2 shadow-2xl border border-base-300"
	>
		{#each langs as l}
			<li>
				<button
					class={currentLang === l ? 'active font-bold' : ''}
					onclick={() => changeLanguage(l)}
				>
					{l.toUpperCase()}
				</button>
			</li>
		{/each}
	</ul>
</div>
