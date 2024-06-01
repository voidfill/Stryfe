import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

import { visualizer } from "rollup-plugin-visualizer";
import compileTime from "vite-plugin-compile-time";
import solid from "vite-plugin-solid";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()], // i dont really care about code protection, minor speedup though.
	},
	preload: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()],
	},
	renderer: {
		build: {
			minify: "esbuild",
			rollupOptions: {
				output: {
					manualChunks: {
						highlight: ["./src/renderer/src/modules/highlight.ts"],
						protos: ["./node_modules/discord-protos"],
					},
				},
			},
		},
		plugins: [solid(), compileTime(), visualizer({ brotliSize: true, filename: "module-stats.html", gzipSize: true, template: "sunburst" })],
		publicDir: resolve("src/renderer/public"),
		resolve: {
			alias: {
				"@components": resolve("src/renderer/src/components"),
				"@constants": resolve("src/renderer/src/constants"),
				"@modules": resolve("src/renderer/src/modules"),
				"@renderer": resolve("src/renderer/src"),
				"@resources": resolve("resources"),
				"@stores": resolve("src/renderer/src/stores"),
			},
		},
	},
});
