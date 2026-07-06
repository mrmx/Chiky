import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	initConfig,
	getConfig,
	validateConfigDev,
	navItems,
	navAllLinks,
	findGroup,
	cfg,
	isGroup,
	isLink,
	siteName,
	siteCopyright,
	siteLogo,
	siteUrl,
	defaultLang,
	supportedLangs,
	showHeader,
	showFooter,
	headerNavItems,
	footerNavItems
} from '../src/lib/config.js';
import type { AppConfig, NavNode, Link, Group } from '../src/lib/config.js';

// ---------------------------------------------------------------------------
// Shared test config builders
// ---------------------------------------------------------------------------
function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
	return {
		site: { name: 'Test Site' },
		i18n: { defaultLang: 'en', supported: ['en', 'es'] },
		nav: {
			header: {
				show: true,
				items: {
					en: [
						{ name: 'Home', href: '/' },
						{ name: 'About', href: '/about' }
					],
					es: [{ name: 'Inicio', href: '/es' }]
				}
			},
			footer: { show: false }
		},
		...overrides
	};
}

const linkA: Link = { name: 'Link A', href: '/a' };
const linkB: Link = { name: 'Link B', href: '/b' };
const linkC: Link = { name: 'Link C', href: '/c' };
const groupNested: Group = { name: 'Nested Group', items: [linkC] };
const groupTop: Group = { name: 'Top Group', items: [linkA, groupNested] };

// ---------------------------------------------------------------------------
// isGroup / isLink
// ---------------------------------------------------------------------------
describe('isGroup / isLink', () => {
	it('isGroup returns true for a group node', () => {
		expect(isGroup(groupTop)).toBe(true);
	});

	it('isGroup returns false for a link node', () => {
		expect(isGroup(linkA)).toBe(false);
	});

	it('isLink returns true for a link node', () => {
		expect(isLink(linkA)).toBe(true);
	});

	it('isLink returns false for a group node', () => {
		expect(isLink(groupTop)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// initConfig / getConfig — tested with vi.resetModules() for cache isolation
// ---------------------------------------------------------------------------
describe('initConfig / getConfig (module reset for cache)', () => {
	it('throws if getConfig called before initConfig', async () => {
		vi.resetModules();
		const { getConfig: freshGetConfig } = await import('../src/lib/config.js');
		expect(() => freshGetConfig()).toThrow('call initConfig() before');
	});

	it('returns config after initConfig', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		const raw = makeConfig();
		freshInit(raw);
		const result = freshGet();
		expect(result.site.name).toBe('Test Site');
	});
});

// ---------------------------------------------------------------------------
// normalizeConfig
// ---------------------------------------------------------------------------
describe('normalizeConfig (via initConfig)', () => {
	beforeEach(() => {
		// Reset module cache so each test starts with a fresh `cached = null`
		vi.resetModules();
	});

	it('deduplicates defaultLang in supported', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		// defaultLang 'en' is already in supported ['en', 'es'] → should remain once
		const raw = makeConfig({
			i18n: { defaultLang: 'en', supported: ['en', 'es'] }
		});
		freshInit(raw);
		const config = freshGet();
		const enCount = config.i18n.supported.filter((l) => l === 'en').length;
		expect(enCount).toBe(1);
	});

	it('prepends defaultLang when not in supported', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		const raw = makeConfig({
			i18n: { defaultLang: 'fr', supported: ['en', 'es'] }
		});
		freshInit(raw);
		const config = freshGet();
		expect(config.i18n.supported[0]).toBe('fr');
		expect(config.i18n.supported).toContain('en');
	});

	it('strips a trailing slash from site.url', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		const raw = makeConfig({ site: { name: 'Test Site', url: 'https://example.com/' } });
		freshInit(raw);
		expect(freshGet().site.url).toBe('https://example.com');
	});

	it('strips multiple trailing slashes from site.url', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		const raw = makeConfig({ site: { name: 'Test Site', url: 'https://example.com///' } });
		freshInit(raw);
		expect(freshGet().site.url).toBe('https://example.com');
	});

	it('leaves site.url undefined untouched', async () => {
		vi.resetModules();
		const { initConfig: freshInit, getConfig: freshGet } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshGet().site.url).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// validateConfigDev
// ---------------------------------------------------------------------------
describe('validateConfigDev', () => {
	it('passes for a valid config', () => {
		expect(() => validateConfigDev(makeConfig())).not.toThrow();
	});

	it('throws when site.name is not string', () => {
		const c = makeConfig({ site: { name: 123 as any } });
		expect(() => validateConfigDev(c)).toThrow('site.name must be string');
	});

	it('throws when site.copyright is not string', () => {
		const c = makeConfig({ site: { name: 'Test', copyright: 42 as any } });
		expect(() => validateConfigDev(c)).toThrow('site.copyright must be string if provided');
	});

	it('throws when site.logoUrl is not string', () => {
		const c = makeConfig({ site: { name: 'Test', logoUrl: true as any } });
		expect(() => validateConfigDev(c)).toThrow('site.logoUrl must be string if provided');
	});

	it('throws when site.url is not string', () => {
		const c = makeConfig({ site: { name: 'Test', url: 42 as any } });
		expect(() => validateConfigDev(c)).toThrow('site.url must be string if provided');
	});

	it('passes when site.url is a valid string', () => {
		const c = makeConfig({ site: { name: 'Test', url: 'https://example.com' } });
		expect(() => validateConfigDev(c)).not.toThrow();
	});

	it('throws when i18n.defaultLang is not string', () => {
		const c = makeConfig({ i18n: { defaultLang: 1 as any, supported: ['en'] } });
		expect(() => validateConfigDev(c)).toThrow('i18n.defaultLang must be string');
	});

	it('throws when i18n.supported is not array', () => {
		const c = makeConfig({ i18n: { defaultLang: 'en', supported: 'en' as any } });
		expect(() => validateConfigDev(c)).toThrow('i18n.supported must be string[]');
	});

	it('throws when nav is not object', () => {
		const c = makeConfig({ nav: 'bad' as any });
		expect(() => validateConfigDev(c)).toThrow('nav must be object');
	});

	it('throws when nav section is not object', () => {
		const c = makeConfig({ nav: { header: 'bad' as any, footer: { show: false } } });
		expect(() => validateConfigDev(c)).toThrow('nav.header must be object');
	});

	it('throws when nav section.show is not boolean', () => {
		const c = makeConfig({
			nav: { header: { show: 'yes' as any }, footer: { show: false } }
		});
		expect(() => validateConfigDev(c)).toThrow('nav.header.show must be boolean');
	});

	it('throws when nav section.items is not object', () => {
		const c = makeConfig({
			nav: {
				header: { show: true, items: ['bad'] as any },
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('nav.header.items must be Record<lang, NavNode[]>');
	});

	it('throws when nav items array is not array', () => {
		const c = makeConfig({
			nav: {
				header: { show: true, items: { en: 'bad' as any } },
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('nav.header.items["en"] must be NavNode[]');
	});

	it('throws when link is missing name or href', () => {
		const c = makeConfig({
			nav: {
				header: { show: true, items: { en: [{ href: '/a' } as any] } },
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('must have string name & href');
	});

	it('throws when link.icon is not string', () => {
		const c = makeConfig({
			nav: {
				header: { show: true, items: { en: [{ name: 'A', href: '/a', icon: 99 as any }] } },
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('icon must be string');
	});

	it('throws when link.target is not string', () => {
		const c = makeConfig({
			nav: {
				header: { show: true, items: { en: [{ name: 'A', href: '/a', target: 99 as any }] } },
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('target must be string');
	});

	it('throws when group.name is not string', () => {
		const c = makeConfig({
			nav: {
				header: {
					show: true,
					items: { en: [{ name: 123 as any, items: [] } as any] }
				},
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('name must be string (group)');
	});

	it('throws when group.icon is not string', () => {
		const c = makeConfig({
			nav: {
				header: {
					show: true,
					items: { en: [{ name: 'G', icon: 5 as any, items: [] }] }
				},
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('icon must be string');
	});

	it('validates nested group children recursively', () => {
		const c = makeConfig({
			nav: {
				header: {
					show: true,
					items: { en: [{ name: 'G', items: [{ href: '/bad' } as any] }] }
				},
				footer: { show: false }
			}
		});
		expect(() => validateConfigDev(c)).toThrow('must have string name & href');
	});
});

// ---------------------------------------------------------------------------
// navItems
// ---------------------------------------------------------------------------
describe('navItems', () => {
	beforeEach(async () => {
		vi.resetModules();
		const { initConfig: freshInit } = await import('../src/lib/config.js');
		freshInit(makeConfig());
	});

	it('returns items for the given lang', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navItems: freshNavItems } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		const items = freshNavItems('header', 'en');
		expect(items).toHaveLength(2);
		expect((items[0] as Link).href).toBe('/');
	});

	it('falls back to defaultLang when lang not found', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navItems: freshNavItems } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		const items = freshNavItems('header', 'fr'); // fr doesn't exist → fallback en
		expect(items).toHaveLength(2);
	});

	it('uses defaultLang when no lang argument', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navItems: freshNavItems } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		const items = freshNavItems('header');
		expect(items).toHaveLength(2);
	});

	it('returns [] when section has no items', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navItems: freshNavItems } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		const items = freshNavItems('footer'); // footer has no items
		expect(items).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// navAllLinks
// ---------------------------------------------------------------------------
describe('navAllLinks', () => {
	it('flattens groups into links depth-first', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navAllLinks: freshNavAllLinks } =
			await import('../src/lib/config.js');
		const config = makeConfig({
			nav: {
				header: {
					show: true,
					items: {
						en: [groupTop, linkB] as NavNode[]
					}
				},
				footer: { show: false }
			}
		});
		freshInit(config);
		const links = freshNavAllLinks('header', 'en');
		// groupTop → linkA, groupNested → linkC, then linkB
		expect(links).toHaveLength(3);
		expect(links[0].name).toBe('Link A');
		expect(links[1].name).toBe('Link C');
		expect(links[2].name).toBe('Link B');
	});

	it('returns empty array when no items', async () => {
		vi.resetModules();
		const { initConfig: freshInit, navAllLinks: freshNavAllLinks } =
			await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshNavAllLinks('footer', 'en')).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// findGroup
// ---------------------------------------------------------------------------
describe('findGroup', () => {
	it('finds a top-level group by name', async () => {
		vi.resetModules();
		const { initConfig: freshInit, findGroup: freshFindGroup } =
			await import('../src/lib/config.js');
		const config = makeConfig({
			nav: {
				header: {
					show: true,
					items: { en: [groupTop] as NavNode[] }
				},
				footer: { show: false }
			}
		});
		freshInit(config);
		const found = freshFindGroup('header', 'Top Group', 'en');
		expect(found).toBeDefined();
		expect(found?.name).toBe('Top Group');
	});

	it('finds a nested group by name (depth-first)', async () => {
		vi.resetModules();
		const { initConfig: freshInit, findGroup: freshFindGroup } =
			await import('../src/lib/config.js');
		const config = makeConfig({
			nav: {
				header: {
					show: true,
					items: { en: [groupTop] as NavNode[] }
				},
				footer: { show: false }
			}
		});
		freshInit(config);
		const found = freshFindGroup('header', 'Nested Group', 'en');
		expect(found).toBeDefined();
		expect(found?.name).toBe('Nested Group');
	});

	it('returns undefined when group not found', async () => {
		vi.resetModules();
		const { initConfig: freshInit, findGroup: freshFindGroup } =
			await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshFindGroup('header', 'Nonexistent', 'en')).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// cfg() — dot-path accessor with fallback
// ---------------------------------------------------------------------------
describe('cfg()', () => {
	it('returns value at dot-path', async () => {
		vi.resetModules();
		const { initConfig: freshInit, cfg: freshCfg } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshCfg('site.name')).toBe('Test Site');
	});

	it('returns fallback when path missing', async () => {
		vi.resetModules();
		const { initConfig: freshInit, cfg: freshCfg } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshCfg('site.nonexistent', 'DEFAULT')).toBe('DEFAULT');
	});

	it('returns nested value', async () => {
		vi.resetModules();
		const { initConfig: freshInit, cfg: freshCfg } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshCfg('i18n.defaultLang')).toBe('en');
	});
});

// ---------------------------------------------------------------------------
// initConfig with validate option
// ---------------------------------------------------------------------------
describe('initConfig — validate option', () => {
	it('runs validateConfigDev when validate=true and config is valid', async () => {
		vi.resetModules();
		const { initConfig: freshInit } = await import('../src/lib/config.js');
		expect(() => freshInit(makeConfig(), { validate: true })).not.toThrow();
	});

	it('throws when validate=true and config is invalid', async () => {
		vi.resetModules();
		const { initConfig: freshInit } = await import('../src/lib/config.js');
		const bad = makeConfig({ site: { name: 999 as any } });
		expect(() => freshInit(bad, { validate: true })).toThrow('site.name must be string');
	});
});

// ---------------------------------------------------------------------------
// Narrow helpers — require initConfig to be called first
// ---------------------------------------------------------------------------
describe('narrow helpers', () => {
	it('siteName returns site name', async () => {
		vi.resetModules();
		const {
			initConfig: freshInit,
			siteName: freshSiteName,
			siteCopyright: freshSiteCopyright,
			siteLogo: freshSiteLogo,
			defaultLang: freshDefaultLang,
			supportedLangs: freshSupportedLangs,
			showHeader: freshShowHeader,
			showFooter: freshShowFooter,
			headerNavItems: freshHeaderNavItems,
			footerNavItems: freshFooterNavItems
		} = await import('../src/lib/config.js');

		const config = makeConfig({
			site: { name: 'My Site', copyright: '2025 Me', logoUrl: '/logo.svg' }
		});
		freshInit(config);

		expect(freshSiteName()).toBe('My Site');
		expect(freshSiteCopyright()).toBe('2025 Me');
		expect(freshSiteLogo()).toBe('/logo.svg');
		expect(freshDefaultLang()).toBe('en');
		expect(freshSupportedLangs()).toContain('en');
		expect(freshShowHeader()).toBe(true);
		expect(freshShowFooter()).toBe(false);
		expect(freshHeaderNavItems('en')).toHaveLength(2);
		expect(freshFooterNavItems('en')).toHaveLength(0);
	});

	it('siteCopyright falls back to site.name when copyright not set', async () => {
		vi.resetModules();
		const { initConfig: freshInit, siteCopyright: freshSiteCopyright } =
			await import('../src/lib/config.js');
		freshInit(makeConfig({ site: { name: 'Fallback Name' } }));
		expect(freshSiteCopyright()).toBe('Fallback Name');
	});

	it('siteLogo returns undefined when logoUrl not set', async () => {
		vi.resetModules();
		const { initConfig: freshInit, siteLogo: freshSiteLogo } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshSiteLogo()).toBeUndefined();
	});

	it('siteUrl returns the normalized site.url', async () => {
		vi.resetModules();
		const { initConfig: freshInit, siteUrl: freshSiteUrl } = await import('../src/lib/config.js');
		freshInit(makeConfig({ site: { name: 'Test', url: 'https://example.com/' } }));
		expect(freshSiteUrl()).toBe('https://example.com');
	});

	it('siteUrl returns undefined when site.url not set', async () => {
		vi.resetModules();
		const { initConfig: freshInit, siteUrl: freshSiteUrl } = await import('../src/lib/config.js');
		freshInit(makeConfig());
		expect(freshSiteUrl()).toBeUndefined();
	});
});
