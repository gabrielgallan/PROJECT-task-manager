import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		name: 'UNIT',
		include: ['./src/domain/**/*.spec.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
		},
	},
})
