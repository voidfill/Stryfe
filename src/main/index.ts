import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import { join } from "path";
import os from "os";

import icon from "../../build/icon.png?asset";

import { pack, stats as erlStats, unpack } from "erl";

const headers = new Set<[string, string[] | ((prev: any) => string[])]>([
	["access-control-allow-origin", ["http://localhost:5173"]],
	["access-control-allow-headers", (p): [string] => [p + ", Credentials"]],
	["set-cookie", (p): string[] => p.map((c: string) => (~c.indexOf("SameSite") ? c : c + "; SameSite=None"))],
]);
const toDelete = new Set(["content-security-policy-report-only", "content-security-policy", "x-frame-options"]);

function createWindow(): BrowserWindow {
	const mainWindow = new BrowserWindow({
		autoHideMenuBar: true,
		height: 670,
		minHeight: 200,
		minWidth: 300,
		show: false,
		width: 900,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
		},
	});

	mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		if (!details.responseHeaders) return callback({ cancel: false });

		const currHeaders = Object.keys(details.responseHeaders);

		for (const [key, value] of headers) {
			const k = currHeaders.find((h) => h.toLowerCase() === key.toLowerCase());
			if (!k && typeof value === "function") continue;

			details.responseHeaders[k ?? key] = typeof value === "function" ? value(details.responseHeaders[key]) : value;
		}

		for (const key of toDelete) {
			const k = currHeaders.find((h) => h.toLowerCase() === key);
			if (!k) continue;

			delete details.responseHeaders[k];
		}

		callback({ cancel: false, responseHeaders: details.responseHeaders });
	});

	mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
		{
			urls: ["https://*.discord.com/*"],
		},
		(details, callback) => {
			details.requestHeaders["Origin"] = details.requestHeaders["Referer"] = "https://discord.com";

			callback({ cancel: false, requestHeaders: details.requestHeaders });
		},
	);

	mainWindow.on("ready-to-show", () => {
		mainWindow.webContents.openDevTools();
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}

	return mainWindow;
}

// https://peter.sh/experiments/chromium-command-line-switches/#password-store
if (os.type() === "Linux") app.commandLine.appendSwitch("password-store", "gnome-libsecret");

app.whenReady().then(() => {
	electronApp.setAppUserModelId("com.electron");
	ipcMain.handle("encryption:available", () => safeStorage.isEncryptionAvailable());
	ipcMain.handle("encryption:encrypt", (_, data: string) => safeStorage.encryptString(data).toString("base64"));
	ipcMain.handle("encryption:decrypt", (_, data: string) => safeStorage.decryptString(Buffer.from(data, "base64")));
	ipcMain.handle("erl:pack", (_, data: any) => pack(data));
	ipcMain.handle("erl:unpack", (_, data: Buffer) => unpack(data));
	ipcMain.handle("erl:stats", () => {
		const stats = erlStats();
		return Object.keys(stats)
			.map((k) => ({ amount: stats[k], tag: k }))
			.filter((e) => e.amount != 0)
			.sort((a, b) => b.amount - a.amount);
	});
	ipcMain.handle("is:dev", () => is.dev);

	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	const window = createWindow();

	ipcMain.handle("useragent:set", (_, ua: string) => {
		window.webContents.session.setUserAgent(ua);
	});

	app.on("activate", function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
