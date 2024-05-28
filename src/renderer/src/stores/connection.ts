import { createSignal } from "solid-js";

import Store from ".";

export const enum TLState {
	NONE = -1,
	CONN_OPEN = 0,
	HELLO_RECEIVED = 1,
	READY = 2,
	READY_SUPP = 3,
}

const [connected, setConnected] = createSignal(false);
const [outOfRetries, setOutOfRetries] = createSignal(false);
const [uiVisible, setUiVisible] = createSignal(false);
const [tlState, setTlState] = createSignal(TLState.NONE);
const [firstConnect, setFirstConnect] = createSignal(true);
const [trace, setTrace] = createSignal<string[]>([]);
let timeoutId: NodeJS.Timeout | undefined;

export default new (class ConnectionStore extends Store {
	constructor() {
		super({
			GATEWAY_CONN_OPEN: () => setTlState(TLState.CONN_OPEN),
			GATEWAY_CONNECT: () => {
				setConnected(true);
				setOutOfRetries(false);
				if (timeoutId) timeoutId = void clearTimeout(timeoutId);
				setUiVisible(true);
				setFirstConnect(false);
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
			GATEWAY_HELLO_RECEIVED: () => setTlState(TLState.HELLO_RECEIVED),
			READY: ({ _trace }) => {
				setTlState(TLState.READY);
				setTrace(_trace);
			},
			READY_SUPPLEMENTAL: () => setTlState(TLState.READY_SUPP),
			RESUMED: ({ _trace }) => setTrace(_trace),
		});
	}

	connected = connected;
	outOfRetries = outOfRetries;
	uiVisible = uiVisible;
	tlState = tlState;
	firstConnect = firstConnect;
	trace = trace;
})();
