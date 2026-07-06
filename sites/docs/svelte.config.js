import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(adapter, vitePreprocess, mdsvex);
