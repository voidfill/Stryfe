import { app, screen } from "electron";
import { join } from "path";

import { accessSync, readFileSync, writeFileSync } from "fs";

const path = join(app.getPath("userData"), "/windowstate.json");
let data: { bounds?: Electron.Rectangle; fullscreen?: boolean; maximized?: boolean } = {};
try {
	accessSync(path);
	data = JSON.parse(readFileSync(path.toString(), { encoding: "utf-8" }));
} catch (e) {
	console.log("Failed to read window state:", e);
}

export function getConstructorOptions(): Partial<Electron.BrowserWindowConstructorOptions> {
	const bounds = data.bounds;
	if (
		!bounds ||
		!bounds.width ||
		!bounds.height ||
		!screen
			.getAllDisplays()
			.some(
				(d) =>
					d &&
					d.bounds.x <= bounds.x &&
					d.bounds.y <= bounds.y &&
					d.bounds.x + d.bounds.width >= bounds.x + bounds.width &&
					d.bounds.y + d.bounds.height >= bounds.y + bounds.height,
			)
	) {
		data = {};
		writeFileSync(path, JSON.stringify(data));
		return {};
	}
	return { height: bounds.height, width: bounds.width, x: bounds.x, y: bounds.y };
}

export function manageWindowState(window: Electron.BrowserWindow): void {
	window.on("close", () => {
		data = { ...data, bounds: window.getBounds(), fullscreen: window.isFullScreen(), maximized: window.isMaximized() };
		writeFileSync(path, JSON.stringify(data));
	});

	if (data.fullscreen) window.setFullScreen(true);

	if (data.maximized) window.maximize();
}
