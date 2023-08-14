import { createSignal } from "solid-js";
import Store from ".";

const [connected, setConnected] = createSignal(false);
const [outOfRetries, setOutOfRetries] = createSignal(false);

export default new (class ConnectionStore extends Store {
	constructor() {
		super({
			GATEWAY_CONNECT: () => setConnected(true) && setOutOfRetries(false),
			GATEWAY_DISCONNECT: () => setConnected(false),
			GATEWAY_GIVE_UP: () => setOutOfRetries(true),
		});
	}

	get connected(): () => boolean {
		return connected;
	}

	get outOfRetries(): () => boolean {
		return outOfRetries;
	}
})();
