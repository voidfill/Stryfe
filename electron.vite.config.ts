import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
	},
	renderer: {
		plugins: [solid()],
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
