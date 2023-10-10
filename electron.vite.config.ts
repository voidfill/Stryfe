import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

import devtools from "solid-devtools/vite";
import compileTime from "vite-plugin-compile-time";
import solid from "vite-plugin-solid";

const solidDevtoolsEnabled = true; // devtools babel plugin kills startup performance, remove if you dont need it.

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()], // i dont really care about code protection, minor speedup though.
	},
	preload: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()],
	},
	renderer: {
		plugins: [
			solid(),
			compileTime(),
			...(solidDevtoolsEnabled
				? [
						devtools({
							autoname: true,
							locator: {
								componentLocation: true,
								jsxLocation: true,
								key: "Control",
								targetIDE: "vscode",
							},
						}),
				  ]
				: []),
		],
		publicDir: resolve("src/renderer/public"),
		resolve: {
			alias: {
				"@common": resolve("src/renderer/src/common"),
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
