import { ElectronAPI } from "@electron-toolkit/preload";
import os from "os";

import { ipc } from "./index";

import { type inspect } from "util";

declare global {
	interface Window {
		electron: ElectronAPI;
		ipc: typeof ipc;
		isDev: boolean;
		nodeInspect: inspect;
		os: typeof os;
		os_type: string;
		stores: isDev extends true ? Record<string, object> : undefined;
	}
}
