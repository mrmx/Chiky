import type { Component } from 'svelte';

// --- Navigation metadata ----------------------------------------------------
export type NavEntry = {
	/** Display title for navigation (can differ from page title) */
	title?: string;
	/** Optional ordering hint; lower means earlier in lists */
	order?: number;
};

// --- Content related types -----------------------------------------------------------
export type ContentFrontmatter = {
	id: string; // required: canonical id shared across translations
	title?: string;
	/** Optional navigation metadata for building menus */
	nav?: NavEntry;
	/** Meta description / og:description / twitter description for `<Seo>` */
	description?: string;
	/** Social preview image (og:image); relative paths are resolved against the page origin */
	image?: string;
	// Allow any extra frontmatter fields
	[key: string]: unknown;
};

export type ContentEntry = {
	lang: string;
	slug: string;
	metadata: ContentFrontmatter;
	component: Component;
};

export type ContentIndex = {
	bySlug: Record<string, ContentEntry>;
	byId: Record<string, Record<string, ContentEntry>>; // id -> lang -> entry
	errors: string[];
	warnings: string[];
};
