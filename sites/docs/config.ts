import type { AppConfig } from '@mrmx/chiqui';

const extTarget = '_blank';

const config: AppConfig = {
	site: {
		name: 'Chiqui',
		logoUrl: '/img/logo.svg',
		// Placeholder domain (chiqui.example uses the IANA-reserved .example TLD, so it can
		// never resolve to a real site) — replace with this site's real deployed domain once
		// it has one. Used as the origin for canonical/hreflang/OG tags and sitemap.xml/robots.txt.
		url: 'https://chiqui.example'
	},
	i18n: {
		defaultLang: 'en',
		supported: ['en', 'es']
	},
	nav: {
		header: {
			show: true,
			items: {
				en: [
					{ name: 'Docs', href: '/en/docs' },
					{ name: 'Components', href: '/en/components' },
					{ name: 'About', href: '/en/about' },
					{
						name: 'Resources',
						items: [
							{
								name: 'Changelog',
								href: 'https://github.com/mrmx/Chiqui/releases',
								target: extTarget
							},
							{ name: 'Issues', href: 'https://github.com/mrmx/Chiqui/issues', target: extTarget }
						]
					},
					{
						name: '',
						title: 'GitHub',
						icon: 'streamline-logos:github-logo-2',
						href: 'https://github.com/mrmx/Chiqui',
						target: extTarget
					}
				],
				es: [
					{ name: 'Docs', href: '/es/docs' },
					{ name: 'Componentes', href: '/es/componentes' },
					{ name: 'Acerca de', href: '/es/acerca' },
					{
						name: 'Recursos',
						items: [
							{
								name: 'Cambios',
								href: 'https://github.com/mrmx/Chiqui/releases',
								target: extTarget
							},
							{
								name: 'Incidencias',
								href: 'https://github.com/mrmx/Chiqui/issues',
								target: extTarget
							}
						]
					},
					{
						name: '',
						title: 'GitHub',
						icon: 'streamline-logos:github-logo-2',
						href: 'https://github.com/mrmx/Chiqui',
						target: extTarget
					}
				]
			}
		},
		footer: {
			show: true,
			items: {
				en: [
					{
						name: 'Social',
						items: [
							{
								name: 'GitHub',
								href: 'https://github.com/mrmx/Chiqui',
								target: extTarget
							}
						]
					}
				],
				es: [
					{
						name: 'Social',
						items: [
							{
								name: 'GitHub',
								href: 'https://github.com/mrmx/Chiqui',
								target: extTarget
							}
						]
					}
				]
			}
		}
	}
};

export default config;
