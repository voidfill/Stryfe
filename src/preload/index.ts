import { contextBridge, ipcRenderer } from "electron";
import os from "os";
import { electronAPI } from "@electron-toolkit/preload";

const canEncrypt = ipcRenderer.invoke("encryption:available");
const isDev = ipcRenderer.invoke("is:dev");
export const ipc = {
	decrypt: (data: string): Promise<string> => ipcRenderer.invoke("encryption:decrypt", data),
	encrypt: (data: string): Promise<string> => ipcRenderer.invoke("encryption:encrypt", data),
	isEncryptionAvailable: (): Promise<boolean> => canEncrypt,
	pack: (data: any): Promise<Uint8Array> => ipcRenderer.invoke("erl:pack", data),
	unpack: (data: Uint8Array): Promise<any> => ipcRenderer.invoke("erl:unpack", data),
	unpackStats: (): Promise<any> => ipcRenderer.invoke("erl:stats"),
};

const allowed = new Set(["Darwin", "Linux", "Windows"]);
let osType = os.type();
osType = allowed.has(osType) ? osType : "Windows";

(async (): Promise<void> => {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("ipc", ipc);
		contextBridge.exposeInMainWorld("os", os);

		contextBridge.exposeInMainWorld("isDev", await isDev);
		contextBridge.exposeInMainWorld("os_type", osType);
	} catch (error) {
		console.error(error);
	}
})();
