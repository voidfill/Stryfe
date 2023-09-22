import { createSignal } from "solid-js";

import Store from ".";

const [height, setHeight] = createSignal(window.innerHeight);
const [width, setWidth] = createSignal(window.innerWidth);
const [isFocused, setIsFocused] = createSignal(document.hasFocus());

export default new (class WindowStore extends Store {
	constructor() {
		super({});

		window.addEventListener("resize", () => {
			setHeight(window.innerHeight);
			setWidth(window.innerWidth);
		});

		window.addEventListener("focus", () => setIsFocused(true));
		window.addEventListener("blur", () => setIsFocused(false));
	}

	get height(): () => number {
		return height;
	}

	get width(): () => number {
		return width;
	}

	get isFocused(): () => boolean {
		return isFocused;
	}
})();
