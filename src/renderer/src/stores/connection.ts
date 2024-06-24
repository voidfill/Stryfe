import { createSignal } from "solid-js";

import { on } from "@modules/dispatcher";

import { registerDebugStore } from ".";

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

on("GATEWAY_CONN_OPEN", () => setTlState(TLState.CONN_OPEN));

on("GATEWAY_CONNECT", () => {
	setConnected(true);
	setOutOfRetries(false);
	if (timeoutId) timeoutId = void clearTimeout(timeoutId);
	setUiVisible(true);
	setFirstConnect(false);
});

on("GATEWAY_DISCONNECT", () => {
	setConnected(false);
	timeoutId = setTimeout(() => setUiVisible(false), 10_000);
});

on("GATEWAY_GIVE_UP", () => {
	setOutOfRetries(true);
	if (timeoutId) timeoutId = void clearTimeout(timeoutId);
	setUiVisible(false);
});

on("GATEWAY_HELLO_RECEIVED", () => setTlState(TLState.HELLO_RECEIVED));

on("READY", ({ _trace }) => {
	setTlState(TLState.READY);
	setTrace(_trace);
});
on("READY_SUPPLEMENTAL", () => setTlState(TLState.READY_SUPP));

on("RESUMED", ({ _trace }) => setTrace(_trace));

export { connected, outOfRetries, uiVisible, tlState, firstConnect, trace };

registerDebugStore("connection", {
	connected,
	firstConnect,
	outOfRetries,
	tlState,
	trace,
	uiVisible,
});
