type Titled = { title?: string };

/** A single link */
export type Link = Readonly<
	{
		name: string;
		href: string;
		icon?: string;
		target?: string;
	} & Titled
>;

/** A nested group (submenu) that contains links and/or more groups */
export type Group = Readonly<
	{
		name: string; // group label in UI
		icon?: string;
		items: NavNode[]; // ordered; can contain links and/or groups
	} & Titled
>;

/** Union node: either a Link (leaf) or a Group (branch) */
export type NavNode = Link | Group;

export interface NavSection {
	show: boolean;
	/** Per-language nav items. Order = array order. */
	items?: Record<string, NavNode[]>;
}

type Section = 'header' | 'footer';

export interface AppConfig {
	site: {
		name: string;
		copyright?: string;
		logoUrl?: string;
	};
	i18n: {
		defaultLang: string;
		supported: readonly string[];
	};
	nav: Record<Section, NavSection>;
}

/* ------------ Type guards ------------ */
export function isGroup(node: NavNode): node is Group {
	return typeof (node as any)?.items !== 'undefined';
}
export function isLink(node: NavNode): node is Link {
	return !isGroup(node);
}

/* ------------ Dev-time validation (no deps) ------------ */
export function validateConfigDev(c: AppConfig): void {
	const err = (m: string) => new Error(`Invalid app config: ${m}`);

	if (typeof c.site.name !== 'string') throw err('site.name must be string');
	if (c.site.copyright != null && typeof c.site.copyright !== 'string')
		throw err('site.copyright must be string if provided');
	if (c.site.logoUrl != null && typeof c.site.logoUrl !== 'string')
		throw err('site.logoUrl must be string if provided');

	if (typeof c.i18n.defaultLang !== 'string') throw err('i18n.defaultLang must be string');
	if (!Array.isArray(c.i18n.supported)) throw err('i18n.supported must be string[]');

	const isObj = (v: unknown): v is Record<string, unknown> =>
		!!v && typeof v === 'object' && !Array.isArray(v);

	const checkNode = (node: any, path: string): void => {
		const isGroupNode = isObj(node) && Array.isArray((node as any).items);
		if (isGroupNode) {
			if (typeof node.name !== 'string') throw err(`${path}.name must be string (group)`);
			if (node.icon != null && typeof node.icon !== 'string')
				throw err(`${path}.icon must be string`);
			(node.items as any[]).forEach((child, i) => checkNode(child, `${path}.items[${i}]`));
			return;
		}

		// Link
		if (typeof node?.name !== 'string' || typeof node?.href !== 'string') {
			throw err(`${path} must have string name & href`);
		}
		if (node.icon != null && typeof node.icon !== 'string')
			throw err(`${path}.icon must be string`);
		if (node.target != null && typeof node.target !== 'string')
			throw err(`${path}.target must be string`);
	};

	if (!isObj(c.nav)) throw err('nav must be object');

	for (const [sectionName, section] of Object.entries(c.nav)) {
		if (!isObj(section)) throw err(`nav.${sectionName} must be object`);
		if (typeof (section as any).show !== 'boolean')
			throw err(`nav.${sectionName}.show must be boolean`);

		const items = (section as any).items;
		if (!items) continue;
		if (!isObj(items)) throw err(`nav.${sectionName}.items must be Record<lang, NavNode[]>`);

		for (const [lang, arr] of Object.entries(items as Record<string, unknown>)) {
			if (!Array.isArray(arr)) throw err(`nav.${sectionName}.items["${lang}"] must be NavNode[]`);
			arr.forEach((node, i) => checkNode(node as any, `nav.${sectionName}.items["${lang}"][${i}]`));
		}
	}
}

/* ------------ Normalize ------------ */
function normalizeConfig(c: AppConfig): AppConfig {
	const supported = Array.from(new Set([c.i18n.defaultLang, ...c.i18n.supported]));
	return { ...c, i18n: { ...c.i18n, supported } };
}

/* ------------ Init + cache ------------ */
let cached: AppConfig | null = null;

export interface InitConfigOptions {
	/** Run dev-time validation (default: false) */
	validate?: boolean;
}

/**
 * Initialize chiqui with a site config. Must be called once before using config helpers.
 * Typically called in your site's root layout or hooks.
 */
export function initConfig(rawConfig: AppConfig, options: InitConfigOptions = {}): AppConfig {
	if (options.validate) validateConfigDev(rawConfig);
	cached = normalizeConfig(rawConfig);
	return cached;
}

export function getConfig(): AppConfig {
	if (!cached) throw new Error('chiqui: call initConfig() before using config helpers');
	return cached;
}

/* ------------ Helpers (header/footer) ------------ */
/** Is the section visible? */
export const showSection = (section: Section) => getConfig().nav[section].show;

/** Root-level nodes (ordered) for a section & language; falls back to defaultLang; [] if none */
export function navItems(section: Section, lang?: string): NavNode[] {
	const cfg = getConfig();
	const l = lang ?? cfg.i18n.defaultLang;
	const items = cfg.nav[section].items ?? {};
	return items[l] ?? items[cfg.i18n.defaultLang] ?? [];
}

/** Depth-first flattened list of all links for a section & language */
export function navAllLinks(section: Section, lang?: string): Link[] {
	const out: Link[] = [];
	const walk = (nodes: NavNode[]) => {
		for (const n of nodes) {
			if (isGroup(n)) walk(n.items);
			else out.push(n);
		}
	};
	walk(navItems(section, lang));
	return out;
}

/** Find a group by name (first match, depth-first) */
export function findGroup(section: Section, name: string, lang?: string): Group | undefined {
	const walk = (nodes: NavNode[]): Group | undefined => {
		for (const n of nodes) {
			if (isGroup(n)) {
				if (n.name === name) return n;
				const found = walk(n.items);
				if (found) return found;
			}
		}
		return undefined;
	};
	return walk(navItems(section, lang));
}

/* dot-path accessor */
export function cfg<T = unknown>(path: string, fallback?: T): T {
	const obj = getConfig() as Record<string, any>;
	const value = path.split('.').reduce<any>((acc, key) => (acc ? acc[key] : undefined), obj);
	return (value ?? fallback) as T;
}

/* --------- Narrow helpers --------- */
export const siteName = () => getConfig().site.name;
export const siteCopyright = () => getConfig().site.copyright ?? getConfig().site.name;
export const siteLogo = () => getConfig().site.logoUrl;
export const defaultLang = () => getConfig().i18n.defaultLang;
export const supportedLangs = () => getConfig().i18n.supported;
export const showHeader = () => showSection('header');
export const showFooter = () => showSection('footer');
export const headerNavItems = (lang?: string) => navItems('header', lang);
export const footerNavItems = (lang?: string) => navItems('footer', lang);
