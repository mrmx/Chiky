---
id: docs
title: Documentación
description: Empieza con Chiqui — instala el paquete, escribe tu configuración, añade contenido Markdown y conecta tu sitio SvelteKit.
---

## Inicio Rápido

Esta página es la instalación completa, de punta a punta — la misma que sigue este propio
sitio (ver su [código fuente](https://github.com/mrmx/Chiqui/tree/main/sites/docs)). Termina
en esta estructura de archivos:

```txt
mi-sitio/
├── config.ts                              # 2. config de sitio/i18n/nav
├── content/
│   ├── en/index.md                        # 6. contenido Markdown, un árbol por idioma
│   └── es/index.md
├── static/
│   └── robots.txt
├── src/
│   ├── app.html                           # placeholder %lang% para createLangHandle()
│   ├── hooks.server.ts                    # 7. assertValidIndex() + createLangHandle()
│   ├── lib/
│   │   ├── config.ts                      # 3. initConfig() + re-exports
│   │   └── content.ts                     # 4. createContent()
│   └── routes/
│       ├── +layout.ts                     # 8. export const prerender = true
│       ├── +layout.svelte                 # 5. <Layout>
│       └── [[lang]]/[...slug]/
│           ├── +page.ts                   # 6. load() + entries()
│           └── +page.svelte               # 6. <Seo> + el componente de contenido cargado
├── svelte.config.js                       # 8. createSvelteConfig()
└── vite.config.ts                         # chiquiViteConfig()
```

### 1. Crear un nuevo sitio

```bash
mkdir mi-sitio && cd mi-sitio
pnpm init
pnpm add @mrmx/chiqui
pnpm add -D @sveltejs/adapter-static
```

### 2. `config.ts` raíz

Metadata del sitio, idiomas soportados y navegación — la única fuente de la que leen todos
los helpers de abajo:

```ts
import type { AppConfig } from '@mrmx/chiqui';

const config: AppConfig = {
	site: {
		name: 'Mi Sitio',
		logoUrl: '/img/logo.svg',
		url: 'https://ejemplo.com'
	},
	i18n: {
		defaultLang: 'es',
		supported: ['es', 'en']
	},
	nav: {
		header: {
			show: true,
			items: {
				es: [{ name: 'Inicio', href: '/es' }],
				en: [{ name: 'Home', href: '/en' }]
			}
		},
		footer: { show: true, items: { es: [], en: [] } }
	}
};

export default config;
```

### 3. `src/lib/config.ts`

Inicializa esa configuración una vez y re-exporta los helpers de config de chiqui
(`siteName`, `defaultLang`, `showFooter`, ...) para que el resto de la app los importe desde
un solo lugar:

```ts
import rawConfig from '../../config';
import { initConfig } from '@mrmx/chiqui/config';

initConfig(rawConfig, { validate: true });

export * from '@mrmx/chiqui/config';
```

### 4. `src/lib/content.ts`

Construye el store de contenido a partir de cada archivo `.md` bajo `content/`:

```ts
import { createContent } from '@mrmx/chiqui/content';

const modules = import.meta.glob('/content/**/*.md', { eager: true });

export const {
	contents,
	index,
	validateIndex,
	assertValidIndex,
	getContent,
	getTranslatedSlug,
	getHreflangAlternates,
	contentRoutes,
	contentEntries
} = createContent(modules);
```

### 5. Layout

`src/routes/+layout.svelte` — `<Layout>` es todo el shell de página: `<Header>` arriba, un
`<main>` con scroll envuelto en `prose` para tu Markdown, `<Footer>` anclado abajo. No hace
falta ningún otro markup ni CSS:

```svelte
<script lang="ts">
	import '@mrmx/chiqui/style.css';
	import { Layout } from '@mrmx/chiqui/components';
	import { getTranslatedSlug } from '$lib/content';

	let { children } = $props();
</script>

<Layout {getTranslatedSlug}>
	{@render children?.()}
</Layout>
```

`<Layout>` (como cada export de `@mrmx/chiqui/components`) está construido con clases DaisyUI
fijas — nada se ve bien hasta que importas `@mrmx/chiqui/style.css` en algún lado, como arriba.

### 6. Contenido + la ruta de página

Los archivos Markdown viven en `content/{lang}/{slug}.md` con frontmatter:

```md
---
id: home
title: Bienvenido
---

¡Hola mundo!
```

El `id` es el identificador canónico — usa el mismo `id` en distintos idiomas para enlazar
traducciones (`content/en/about.md` y `content/es/acerca.md`, ambos con `id: about`). Las
rutas salen de idioma + slug: `content/es/acerca.md` → `/es/acerca`, `content/es/index.md` →
`/es`.

Una única ruta dinámica sirve todas las páginas:

```ts
// src/routes/[[lang]]/[...slug]/+page.ts
import { error } from '@sveltejs/kit';
import { getContent, contentEntries } from '$lib/content';
import { defaultLang } from '$lib/config';

export function entries() {
	return [{ lang: '', slug: '' }, ...contentEntries()];
}

export function load({ params }) {
	let { lang = '', slug } = params;
	if (lang === '') lang = defaultLang();

	const entry = getContent(lang, slug);
	if (!entry) throw error(404, 'Not found');

	return { lang, slug, metadata: entry.metadata, component: entry.component };
}
```

```svelte
<!-- src/routes/[[lang]]/[...slug]/+page.svelte -->
<script lang="ts">
	import type { PageProps } from './$types';
	import { Seo } from '@mrmx/chiqui/components';
	import { getHreflangAlternates } from '$lib/content';

	let { data }: PageProps = $props();
	let metadata = $derived(data.metadata);
	let Page = $derived(data.component);
</script>

<Seo
	lang={data.lang}
	slug={data.slug}
	title={metadata?.title}
	description={metadata?.description}
	image={metadata?.image}
	{getHreflangAlternates}
/>

{#if metadata?.title}
	<h1>{metadata.title}</h1>
{/if}

<Page />
```

`entry.component` es el archivo `.md` compilado a un componente Svelte por mdsvex — renderizar
`<Page />` es lo que pone el HTML de tu Markdown dentro del `<main>` de `<Layout>` del paso 5.

### 7. Validar contenido en build time

Conecta `assertValidIndex()` al hook `init` de `src/hooks.server.ts` para que un build con
contenido roto (ids duplicados, frontmatter faltante, ...) falle de forma ruidosa en vez de
publicarse en silencio:

```ts
// src/hooks.server.ts
import type { ServerInit } from '@sveltejs/kit';
import { assertValidIndex } from '$lib/content';

export const init: ServerInit = async () => {
	assertValidIndex();
};
```

### 8. Generación estática

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { createSvelteConfig } from '@mrmx/chiqui/svelte-config';

export default createSvelteConfig(adapter, vitePreprocess);
```

No hace falta instalar ni importar `mdsvex` tú mismo — `createSvelteConfig` ya lo conecta.
Activa el prerendering en todas las rutas:

```ts
// src/routes/+layout.ts
export const prerender = true;
```

`pnpm build` genera entonces un directorio `build/` totalmente estático (`index.html`,
`es.html`, `es/acerca.html`, `en/about.html`, ...) listo para cualquier hosting estático.

Para la API completa del paquete — helpers de SEO, `<Gallery>`/`<SpecsTable>`/`<CtaBand>`/
`<ContactForm>`, uso headless, opciones de estilos — ver el
[README del paquete](https://github.com/mrmx/Chiqui/tree/main/packages/chiqui#readme).
