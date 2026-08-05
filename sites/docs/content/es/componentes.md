---
id: components
title: Componentes de contenido
description: Gallery, SpecsTable, CtaBand y ContactForm — componentes genéricos con estilo DaisyUI usables directamente desde Markdown vía mdsvex.
---

<script>
	import { Gallery, SpecsTable, CtaBand, ContactForm } from '@mrmx/chiqui/components';

	const galleryItems = [
		{ src: '/img/logo.svg', alt: 'Logo de Chiqui', caption: 'Un elemento de imagen — se renderiza como <img loading="lazy">.' },
		{ src: '/media/demo.mp4', alt: 'Clip de demostración', caption: 'Un elemento de vídeo (.mp4/.webm) — se renderiza como <video> en autoplay. Estos docs no incluyen un asset de vídeo real.' }
	];

	const specs = [
		{ label: 'Framework', value: 'SvelteKit 2 + Svelte 5 runes' },
		{ label: 'Estilos', value: '@mrmx/chiqui/style.css (zero-config) — sin CSS propio' },
		{ label: 'Pipeline de contenido', value: 'mdsvex (Markdown + componentes Svelte)' },
		{ label: 'Renderizado', value: 'Totalmente estático (adapter-static)' }
	];
</script>

Esta página es en sí misma la demostración: todo lo de abajo es un componente de Chiqui
importado y usado directamente dentro de este archivo `.md`, con los datos definidos en línea
en un bloque `<script>`. Este es exactamente el patrón documentado en el README del paquete,
en la sección "Content components" — el que seguiría un sitio real (como una página de
producto portada).

## Estilos sin configuración

Todo este sitio importa `@mrmx/chiqui/style.css` en su layout raíz en vez de instalar y
configurar Tailwind + DaisyUI por su cuenta — ver la sección "Styling `@mrmx/chiqui/components`"
del README (Opción A). Esa hoja de estilos se compila una sola vez, del lado de Chiqui,
escaneando únicamente el código fuente de sus propios componentes — por eso `<Header>`,
`<Footer>`, `<Layout>` y todo lo de esta página (`<Gallery>`, `<SpecsTable>`, `<CtaBand>`,
`<ContactForm>`) se ven bien sin ninguna configuración de build acá. El `+layout.svelte` de
este sitio es solo `<Layout>{@render children?.()}</Layout>` — sin ningún markup ni CSS
propio. Este mismo párrafo también está estilado por `<Layout>`: envuelve el contenido de la
página en `prose prose-neutral dark:prose-invert` (más `max-w-none lg:max-w-5xl` para el
ancho) directo en el markup de ese componente, uno más entre los de chiqui — los títulos, el
espaciado de párrafos, las listas y los bloques de código de todo el sitio salen de `prose` de
`@tailwindcss/typography`, no de CSS escrito a mano.

**El detalle que vale la pena conocer:** los links `btn btn-primary`/`btn btn-ghost` de la
banda CTA de abajo son clases DaisyUI escritas a mano, no salida de un componente de Chiqui —
y funcionan solo porque esas mismas clases también las usa internamente el botón de
`<ContactForm>` y `<LanguageSelect>` (en el header de arriba), así que terminan incluidas en
el CSS compilado igual. Si escribís una clase DaisyUI que ningún componente de Chiqui usa,
no se va a renderizar — la Opción A cubre solo el set fijo de Chiqui, no autoría libre. Ese es
el trade-off de zero-config; un sitio que quiera escribir sus propias clases DaisyUI
libremente necesita su propio Tailwind + DaisyUI (Opción B).

## Gallery

`items: Array<{ src, alt, caption? }>`. La detección de vídeo vs. imagen se hace por la
extensión del archivo (`.mp4`/`.webm` → `<video>`, cualquier otra cosa → `<img>`).

<Gallery items={galleryItems} />

## Tabla de especificaciones

`specs: Array<{ label, value }>` renderizado como una tabla DaisyUI. El framework no tiene
opinión sobre el idioma — resuelve `label` al idioma actual antes de pasarlo.

<SpecsTable {specs} />

## Banda CTA

`title`, `subtitle` opcional, y un snippet `children` para los botones de llamada a la acción.

<CtaBand title="¿Listo para probar Chiqui?" subtitle="Empieza desde los docs y publica un sitio estático hoy mismo.">
	{#snippet children()}
		<a class="btn btn-primary" href="/es/docs">Leer los docs</a>
		<a class="btn btn-ghost" href="https://github.com/mrmx/Chiqui" target="_blank" rel="noopener noreferrer">
			Ver en GitHub
		</a>
	{/snippet}
</CtaBand>

## Formulario de contacto

`endpoint` (por defecto Web3Forms), `accessKey`/`subject` opcionales, y un objeto `labels`
para todos los textos (defaults en inglés, se puede sobrescribir cualquier subconjunto). Sin
`accessKey` configurada degrada de forma limpia — no se envía nada y se muestra
`labels.notConnected` en su lugar:

<ContactForm
labels={{
		title: 'Contacto',
		subtitle: 'Escríbenos y te respondemos pronto.',
		name: 'Nombre',
		email: 'Correo',
		message: 'Mensaje',
		send: 'Enviar',
		sending: 'Enviando…',
		success: '¡Gracias! Tu mensaje ha sido enviado.',
		error: 'Algo salió mal. Inténtalo de nuevo.',
		notConnected: 'Este formulario aún no está conectado.'
	}}
/>
