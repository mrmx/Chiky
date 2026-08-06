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
		{ label: 'Styling', value: '@mrmx/chiqui/style.css (zero-config) — no CSS of its own' },
		{ label: 'Content pipeline', value: 'mdsvex (Markdown + Svelte components)' },
		{ label: 'Rendering', value: 'Fully static (adapter-static)' }
	];
</script>

This page is itself the demonstration: everything below is a Chiqui component imported and
used directly inside this `.md` file, with data defined inline in a `<script>` block. This is
the exact pattern documented in the package README under "Content components" — the one a
real site (like a ported product page) would follow.

## Zero-config styling

This whole site imports `@mrmx/chiqui/style.css` in its root layout instead of installing and
configuring Tailwind + DaisyUI itself — see the README's "Styling `@mrmx/chiqui/components`"
section (Option A). That stylesheet is compiled once, by chiqui, scanned only against
chiqui's own component sources — so `<Header>`, `<Footer>`, `<Layout>`, and everything on this
page (`<Gallery>`, `<SpecsTable>`, `<CtaBand>`, `<ContactForm>`) render correctly with zero
build config here. This site's `+layout.svelte` is just `<Layout>{@render children?.()}</Layout>`
— no markup or CSS of its own at all. This very paragraph is styled by `<Layout>` too: it wraps
page content in `prose prose-neutral dark:prose-invert` (plus `max-w-none lg:max-w-5xl` for
width) directly in its own component markup, one plain chiqui component among the rest —
headings, paragraph spacing, lists, and code blocks on this whole site come from
`@tailwindcss/typography`'s `prose`, not hand-written CSS.

**The gotcha worth knowing:** the `btn btn-primary`/`btn btn-ghost` links inside the CTA band
below are hand-typed DaisyUI classes, not chiqui component output — and they only work
because those exact classes are *also* used internally by `<ContactForm>`'s submit button and
`<LanguageSelect>` (in the header above), so they end up in chiqui's compiled CSS anyway. Type
a DaisyUI class none of chiqui's own components happen to use, and it won't render — Option A
only covers chiqui's fixed set, not open-ended authoring. That's the trade-off for zero
config; a site that wants to freely write its own DaisyUI classes needs its own Tailwind +
DaisyUI setup (Option B) instead.

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
