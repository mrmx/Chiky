import { createContent } from '@mrmx/chiqui/content';

const modules = import.meta.glob('/content/**/*.md', { eager: true });

export const {
	contents,
	index,
	validateIndex,
	getContent,
	getTranslatedSlug,
	getHreflangAlternates,
	contentRoutes
} = createContent(modules);
