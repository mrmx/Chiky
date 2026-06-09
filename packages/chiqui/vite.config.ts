import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			all: true,
			include: ['src/lib/**/*.ts'],
			exclude: [
				'src/lib/types.ts',
				'src/lib/components/**',
				'src/lib/vite.ts',
				'src/lib/svelte-config.ts',
				'src/lib/index.ts'
			],
			reportsDirectory: 'coverage',
			reporter: ['text', 'text-summary']
		}
	}
});
