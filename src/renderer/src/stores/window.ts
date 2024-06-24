import { createSignal } from "solid-js";

import { registerDebugStore } from ".";

const [height, setHeight] = createSignal(window.innerHeight);
const [width, setWidth] = createSignal(window.innerWidth);
const [isFocused, setIsFocused] = createSignal(document.hasFocus());

window.addEventListener("resize", () => {
	setHeight(window.innerHeight);
	setWidth(window.innerWidth);
});

window.addEventListener("focus", () => setIsFocused(true));
window.addEventListener("blur", () => setIsFocused(false));

export { height, width, isFocused };

registerDebugStore("window", {
	height,
	isFocused,
	state: { height, isFocused, width },
	width,
});
