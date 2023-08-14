import { ElectronAPI } from "@electron-toolkit/preload";
import { ipc } from "./index";
import os from "os";
import Store from "@renderer/stores";

declare global {
	interface Window {
		electron: ElectronAPI;
		gateway: InstanceType<typeof import("@renderer/modules/dispatcher").default>;
		ipc: typeof ipc;
		isDev: boolean;
		os: typeof os;
		os_type: string;
		stores: isDev extends true ? Record<string, InstanceType<typeof Store>> : undefined;
	}
}
