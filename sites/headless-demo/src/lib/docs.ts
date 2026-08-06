// Headless usage of @mrmx/chiqui: only the content engine, no @mrmx/chiqui/components.
// This app has its own layout (src/routes/+layout.svelte) — chiqui never sees it.
import type { Component } from 'svelte';
import { createDocsSection } from '@mrmx/chiqui/navigation';

const modules = import.meta.glob<{ default: Component; metadata: Record<string, unknown> }>(
	'./docs/content/*/*.md',
	{ eager: true }
);

export const docs = createDocsSection(modules, {
	basePath: './docs/content/',
	defaultLang: 'en'
});
