import { electronApp, is } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import { join } from "path";
import os from "os";

import icon from "../../build/icon.png?asset";
import { getConstructorOptions, manageWindowState } from "./windowstate";

let osType: string = process.platform;
osType =
	{
		darwin: "Macos",
		linux: "Linux",
		win32: "Windows",
	}[osType] || "Windows";

const allowOriginList = ["https://discord.com", "https://cordapi.dolfi.es"];
const toDelete = new Set(["access-control-allow-origin", "content-security-policy-report-only", "content-security-policy", "x-frame-options"]);

let newUserAgent = "";

function createWindow(): BrowserWindow {
	const mainWindow = new BrowserWindow({
		height: 670,
		minHeight: 200,
		minWidth: 300,
		show: false,
		titleBarStyle: osType === "Linux" ? "default" : "hidden",
		webPreferences: {
			nodeIntegrationInWorker: true,
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
		},
		width: 900,
		...(process.platform === "linux" ? { icon } : {}),
		...getConstructorOptions(),
	});

	mainWindow.setMenuBarVisibility(false);

	mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		if (!details.responseHeaders) return callback({ cancel: false });

		let didSetCredentials = false;

		const currHeaders = Object.keys(details.responseHeaders);

		for (const header of currHeaders) {
			if (toDelete.has(header.toLowerCase())) {
				delete details.responseHeaders[header];
				continue;
			}

			if (header.toLowerCase() === "access-control-allow-headers") {
				if (!details.url.startsWith("https://discord.com")) continue;
				details.responseHeaders[header] = [details.responseHeaders[header][0] + ", Credentials"];
				didSetCredentials = true;
				continue;
			}

			if (header.toLowerCase() === "set-cookie") {
				details.responseHeaders[header] = details.responseHeaders[header].map((c: string) =>
					~c.indexOf("SameSite") ? c.replace(/SameSite=.+\W*/, "SameSite=None ") : c + "; SameSite=None",
				);
			}
		}

		if (details.url.startsWith("https://discord.com") && !didSetCredentials) {
			details.responseHeaders["access-control-allow-headers"] = ["Credentials"];
		}

		for (const origin of allowOriginList) {
			if (details.url.toLowerCase().includes(origin))
				details.responseHeaders["access-control-allow-origin"] = [process.env["ELECTRON_RENDERER_URL"]!];
		}

		callback({ cancel: false, responseHeaders: details.responseHeaders });
	});

	mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
		{
			urls: ["*://*/*"],
		},
		(details, callback) => {
			details.requestHeaders["Origin"] = details.requestHeaders["Referer"] = "https://discord.com";
			if (newUserAgent) {
				details.requestHeaders["User-Agent"] = newUserAgent;
			}

			callback({ cancel: false, requestHeaders: details.requestHeaders });
		},
	);

	mainWindow.on("ready-to-show", () => {
		if (is.dev) mainWindow.webContents.openDevTools();
		mainWindow.show();
		manageWindowState(mainWindow);
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

if (is.dev) {
	app.commandLine.appendSwitch("user-data-dir");
	app.commandLine.appendSwitch("disable-web-security"); // yea. prod loading doesnt even seem to care
	app.commandLine.appendSwitch("enable-precise-memory-info");
}

app.whenReady().then(() => {
	electronApp.setAppUserModelId("com.electron");
	ipcMain.handle("encryption:available", () => safeStorage.isEncryptionAvailable());
	ipcMain.handle("encryption:encrypt", (_, data: string) => safeStorage.encryptString(data).toString("base64"));
	ipcMain.handle("encryption:decrypt", (_, data: string) => safeStorage.decryptString(Buffer.from(data, "base64")));
	ipcMain.handle("is:dev", () => is.dev);
	ipcMain.handle("useragent:set", (_, ua: string) => {
		newUserAgent = ua;
	});
	ipcMain.handle("os:type", () => osType);

	const bw = createWindow();

	ipcMain.handle("window:close", () => bw.close());
	ipcMain.handle("window:minimize", () => bw.minimize());
	ipcMain.handle("window:maximize", () => bw.maximize());

	app.on("activate", function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
