import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, defaultClientConditions } from 'vite';
import tailwindcss from '@tailwindcss/vite';

import { viteStaticCopy } from 'vite-plugin-static-copy';

const backendTarget = process.env.WEBUI_BACKEND_URL || 'http://localhost:8080';

export default defineConfig({
	resolve: {
		// Vite 6+ no longer merges defaults; without them svelte resolves to its server build
		conditions: [...defaultClientConditions, 'onnxruntime-web-use-extern-wasm']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/onnxruntime-web/dist/*.jsep.*',

					dest: 'wasm',
					rename: { stripBase: true }
				}
			]
		})
	],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build')
	},
	build: {
		sourcemap: false,
		rolldownOptions: {
			treeshake: {
				manualPureFunctions:
					process.env.ENV === 'dev' ? [] : ['console.log', 'console.debug', 'console.error']
			}
		}
	},
	server: {
		proxy: {
			'/api': {
				target: backendTarget,
				changeOrigin: true,
				ws: true
			},
			'/ollama': {
				target: backendTarget,
				changeOrigin: true
			},
			'/openai': {
				target: backendTarget,
				changeOrigin: true
			},
			'/oauth': {
				target: backendTarget,
				changeOrigin: true
			},
			'/ws': {
				target: backendTarget,
				changeOrigin: true,
				ws: true
			}
		}
	},
	worker: {
		format: 'es'
	}
});
