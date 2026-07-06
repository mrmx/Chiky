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
		{ label: 'Estilos', value: 'Tailwind CSS 4 + DaisyUI 5' },
		{ label: 'Pipeline de contenido', value: 'mdsvex (Markdown + componentes Svelte)' },
		{ label: 'Renderizado', value: 'Totalmente estático (adapter-static)' }
	];
</script>

Esta página es en sí misma la demostración: todo lo de abajo es un componente de Chiqui
importado y usado directamente dentro de este archivo `.md`, con los datos definidos en línea
en un bloque `<script>`. Este es exactamente el patrón documentado en el README del paquete,
en la sección "Content components" — el que seguiría un sitio real (como una página de
producto portada).

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
