import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		name: 'E2E',
		include: ['./src/infra/**/*.e2e-spec.ts'],
		setupFiles: ['test/e2e/setup-e2e.ts'],
		globals: true,
		root: './',
		hookTimeout: 15000,
		coverage: {
			provider: 'v8',
		},
	},
	plugins: [
		swc.vite({
			module: { type: 'es6' },
		}),
	],
})
