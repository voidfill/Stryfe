import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { Plugin, preprocessCSS, ResolvedConfig } from "vite";
import compileTime from "vite-plugin-compile-time";
import solid from "vite-plugin-solid";

const sheetPlugin = ((): Plugin => {
	const sheetSuffix = "@sheet";
	let resolvedViteConfig: ResolvedConfig;

	return {
		configResolved(config) {
			resolvedViteConfig = config;
		},
		async load(id) {
			if (!id.endsWith(sheetSuffix)) return;
			id = id.slice(0, -sheetSuffix.length);
			const code = readFileSync(id, "utf-8");

			const { code: processedCode, map, deps } = await preprocessCSS(code, id.split("/").pop()!, resolvedViteConfig);
			this.addWatchFile(id);
			for (const dep of deps ?? []) this.addWatchFile(dep);

			const out = `const sheet = new CSSStyleSheet();sheet.replace(${JSON.stringify(processedCode)}).catch(console.error);export default sheet;`;
			return {
				code: out,
				map,
			};
		},
		name: "css-sheet-plugin",
		async resolveId(source, importer, options) {
			if (!source.endsWith(sheetSuffix)) return;
			const resolution = await this.resolve(source.slice(0, -sheetSuffix.length), importer, options);
			if (!resolution || resolution.external) return resolution;
			return resolution.id + sheetSuffix;
		},
		version: "0.0.1",
	} as Plugin;
})();

function sourcemapIgnoreList(sourcePath: string): boolean {
	return sourcePath.includes("node_modules") || sourcePath.includes("shadowcss");
}

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()], // i dont really care about code protection, minor speedup though.
	},
	preload: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()],
	},
	renderer: {
		build: {
			chunkSizeWarningLimit: 1500,
			minify: "esbuild",
			rollupOptions: {
				output: {
					manualChunks: {
						highlight: ["./src/renderer/src/modules/highlight.ts"],
						protos: ["./node_modules/discord-protos"],
					},
					sourcemapIgnoreList,
				},
			},
		},
		plugins: [
			solid(),
			compileTime(),
			visualizer({ brotliSize: true, filename: "module-stats.html", gzipSize: true, template: "sunburst" }),
			sheetPlugin,
		],
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
		server: {
			sourcemapIgnoreList,
		},
	},
});
