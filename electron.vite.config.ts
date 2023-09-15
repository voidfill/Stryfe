import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, bytecodePlugin } from "electron-vite";
import solid from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import compileTime from "vite-plugin-compile-time";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()], // i dont really care about code protection, minor speedup though.
	},
	preload: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()],
	},
	renderer: {
		plugins: [solid(), suidPlugin(), compileTime()],
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
