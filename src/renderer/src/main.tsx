import { render } from "solid-js/web";
import { Router } from "@solidjs/router";

import Storage from "@modules/storage";
import { getToken } from "@modules/token";
import WebSocket from "@modules/gateway";
import { getClientProps } from "./modules/discordversion";

import App from "./app";
import logger from "./modules/logger";

(async (): Promise<void> => {
	if (!(await window.ipc.isEncryptionAvailable()) || !Storage.has("token")) return;
	try {
		const [token, buildNumber] = await Promise.all([getToken(), getClientProps()]);
		window.gateway = new WebSocket(token!, buildNumber);
	} catch (e) {
		logger.error("Failed to get token or clientprops:", e);
	}
})();

render(
	() => (
		<Router>
			<App />
		</Router>
	),
	document.getElementById("root") as HTMLElement,
);
