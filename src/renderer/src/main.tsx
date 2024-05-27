import { render } from "solid-js/web";

import WebSocket from "@modules/gateway";
import logger from "@modules/logger";
import { getToken, getUserIdFromToken } from "@modules/token";

import { cfChallenge, getSuper } from "./modules/discordversion";

import { attachDevtoolsOverlay } from "@solid-devtools/overlay";
attachDevtoolsOverlay();

import { createEffect } from "solid-js";

import API from "@modules/api";

import App from "./app";
import { windowTitle } from "./signals";
import { setSelfId } from "./stores/users";

declare global {
	interface Window {
		gateway: WebSocket;
	}
}

(async (): Promise<void> => {
	if (!(await window.ipc.isEncryptionAvailable())) return;
	try {
		const [token, superProps] = await Promise.all([getToken(), getSuper()]);
		if (!token || !superProps) return;
		const [userId] = await Promise.all([getUserIdFromToken(), cfChallenge()]);
		if (!userId) return;
		setSelfId(userId);
		API.init(
			token!,
			() => {
				throw "no captchahandler yet!";
			},
			superProps.encoded,
		);
		window.gateway = new WebSocket(token!, superProps.properties);
	} catch (e) {
		logger.error("Failed to get token or clientprops:", e);
	}
})();

window.addEventListener("keydown", (e): void => {
	if (e.altKey) {
		if (e.code === "ArrowLeft") {
			e.preventDefault();
			window.history.back();
		}
		if (e.code === "ArrowRight") {
			e.preventDefault();
			window.history.forward();
		}
	}
});

render(() => <App />, document.getElementById("root") as HTMLElement);

const titleEl = document.getElementById("app-title") as HTMLElement;
createEffect(() => {
	titleEl.innerText = windowTitle();
});
