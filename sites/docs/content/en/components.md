---
id: components
title: Content Components
description: Gallery, SpecsTable, CtaBand, and ContactForm — generic, DaisyUI-styled components usable straight from Markdown via mdsvex.
---

<script>
	import { Gallery, SpecsTable, CtaBand, ContactForm } from '@mrmx/chiqui/components';

	const galleryItems = [
		{ src: '/img/logo.svg', alt: 'Chiqui logo', caption: 'An image item — rendered as <img loading="lazy">.' },
		{ src: '/media/demo.mp4', alt: 'Demo clip', caption: 'A video item (.mp4/.webm) — rendered as an autoplaying <video>. No real asset ships with these docs.' }
	];

	const specs = [
		{ label: 'Framework', value: 'SvelteKit 2 + Svelte 5 runes' },
		{ label: 'Styling', value: 'Tailwind CSS 4 + DaisyUI 5' },
		{ label: 'Content pipeline', value: 'mdsvex (Markdown + Svelte components)' },
		{ label: 'Rendering', value: 'Fully static (adapter-static)' }
	];
</script>

This page is itself the demonstration: everything below is a Chiqui component imported and
used directly inside this `.md` file, with data defined inline in a `<script>` block. This is
the exact pattern documented in the package README under "Content components" — the one a
real site (like a ported product page) would follow.

## Gallery

`items: Array<{ src, alt, caption? }>`. Video vs. image is detected from the file extension
(`.mp4`/`.webm` → `<video>`, everything else → `<img>`).

<Gallery items={galleryItems} />

## Specs table

`specs: Array<{ label, value }>` rendered as a DaisyUI table. The framework has no opinion on
language — resolve `label` to the current locale before passing it in.

<SpecsTable {specs} />

## CTA band

`title`, optional `subtitle`, and a `children` snippet for the call-to-action buttons.

<CtaBand title="Ready to try Chiqui?" subtitle="Start from the docs and ship a static site today.">
	{#snippet children()}
		<a class="btn btn-primary" href="/en/docs">Read the docs</a>
		<a class="btn btn-ghost" href="https://github.com/mrmx/Chiqui" target="_blank" rel="noopener noreferrer">
			View on GitHub
		</a>
	{/snippet}
</CtaBand>

## Contact form

`endpoint` (defaults to Web3Forms), optional `accessKey`/`subject`, and a `labels` object for
all copy (English defaults, override any subset). With no `accessKey` configured it degrades
cleanly — nothing is sent and `labels.notConnected` is shown instead:

<ContactForm />
