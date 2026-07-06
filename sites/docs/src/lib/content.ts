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
