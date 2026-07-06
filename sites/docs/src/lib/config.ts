import { initConfig } from '@mrmx/chiqui/config';
import rawConfig from '$config';

export const config = initConfig(rawConfig, { validate: true });

// Re-export chiqui helpers (they read from the initialized config)
export {
	getConfig,
	siteName,
	siteLogo,
	siteUrl,
	defaultLang,
	supportedLangs,
	showHeader,
	showFooter,
	headerNavItems,
	footerNavItems,
	navItems,
	navAllLinks,
	findGroup,
	isGroup,
	isLink,
	showSection,
	cfg
} from '@mrmx/chiqui/config';
