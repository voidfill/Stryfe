import { hashIntegration, Router } from "@solidjs/router";
import { render } from "solid-js/web";

import WebSocket from "@modules/gateway";
import logger from "@modules/logger";
import Storage from "@modules/storage";
import { getToken } from "@modules/token";

import { getSuper } from "./modules/discordversion";

import { attachDevtoolsOverlay } from "@solid-devtools/overlay";
attachDevtoolsOverlay();

import { createEffect, createSignal } from "solid-js";

import App from "./app";

(async (): Promise<void> => {
	if (!(await window.ipc.isEncryptionAvailable()) || !Storage.has("token")) return;
	try {
		const [token, superProps] = await Promise.all([getToken(), getSuper()]);
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

render(
	() => (
		<Router source={hashIntegration()}>
			<App />
		</Router>
	),
	document.getElementById("root") as HTMLElement,
);

export const [windowTitle, setWindowTitle] = createSignal("Stryfe");

const titleEl = document.getElementById("app-title") as HTMLElement;
createEffect(() => {
	titleEl.innerText = windowTitle();
});
