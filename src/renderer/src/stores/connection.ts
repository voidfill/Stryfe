import { createSignal } from "solid-js";

import Store from ".";

const [connected, setConnected] = createSignal(false);
const [outOfRetries, setOutOfRetries] = createSignal(false);
const [uiVisible, setUiVisible] = createSignal(false);
let timeoutId: NodeJS.Timeout | undefined;

export default new (class ConnectionStore extends Store {
	constructor() {
		super({
			GATEWAY_CONNECT: () => {
				setConnected(true);
				setOutOfRetries(false);
				if (timeoutId) timeoutId = void clearTimeout(timeoutId);
				setUiVisible(true);
			},
			GATEWAY_DISCONNECT: () => {
				setConnected(false);
				timeoutId = setTimeout(() => setUiVisible(false), 10_000);
			},
			GATEWAY_GIVE_UP: () => {
				setOutOfRetries(true);
				if (timeoutId) timeoutId = void clearTimeout(timeoutId);
				setUiVisible(false);
			},
		});
	}

	connected = connected;
	outOfRetries = outOfRetries;
	uiVisible = uiVisible;
})();
