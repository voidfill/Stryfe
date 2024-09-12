import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { createLogger, Plugin, preprocessCSS, ResolvedConfig } from "vite";
import compileTime from "vite-plugin-compile-time";
import solid from "vite-plugin-solid";

const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options): void => {
	// ignore postcss failing to parse hsl(from var(--v) ...)
	if (msg.includes("[vite:css]") && msg.includes("Unrecognized text.")) return;
	originalWarn(msg, options);
};

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
			const raw = readFileSync(id, "utf-8");

			const { code: processedCSS, map, deps } = await preprocessCSS(raw, id, resolvedViteConfig);
			this.addWatchFile(id);
			for (const dep of deps ?? []) this.addWatchFile(dep);

			return {
				code: `
const sheet = new CSSStyleSheet();
export default sheet;
export const code = ${JSON.stringify(processedCSS)};

if (import.meta.hot) {
	if (!import.meta.hot.data.handled) {
		import.meta.hot.data.handled = true;
		sheet.replace(code).catch(console.error);

		function a() {
			import.meta.hot.accept((newModule) => {
				sheet.replace(newModule.code).catch(console.error);
				a();
			});
		}
		a();
	}
} else {
	sheet.replace(code).catch(console.error);
}
`,
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
		customLogger: logger,
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
