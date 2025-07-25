import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import os from "os";

import { inspect } from "util";

const canEncrypt = ipcRenderer.invoke("encryption:available");
const isDev = ipcRenderer.invoke("is:dev");
const osType = ipcRenderer.invoke("os:type");
export const ipc = {
	close: (): void => ipcRenderer.send("window:close"),
	decrypt: (data: string): Promise<string> => ipcRenderer.invoke("encryption:decrypt", data),
	encrypt: (data: string): Promise<string> => ipcRenderer.invoke("encryption:encrypt", data),
	getCookies: (): Promise<Electron.Cookie[]> => ipcRenderer.invoke("cookies:get"),
	isEncryptionAvailable: (): Promise<boolean> => canEncrypt,
	maximize: (): void => ipcRenderer.send("window:maximize"),
	minimize: (): void => ipcRenderer.send("window:minimize"),
	setTheme: (theme: "light" | "dark" | "system"): void => ipcRenderer.send("theme:set", theme),
	setUserAgent: (ua: string): Promise<void> => ipcRenderer.invoke("useragent:set", ua),
};

(async (): Promise<void> => {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("ipc", ipc);
		contextBridge.exposeInMainWorld("os", os);
		contextBridge.exposeInMainWorld("nodeInspect", inspect);

		contextBridge.exposeInMainWorld("isDev", await isDev);
		contextBridge.exposeInMainWorld("os_type", await osType);
	} catch (error) {
		console.error(error);
	}
})();
