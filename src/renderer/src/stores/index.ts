import Dispatcher, { dispatches as validDispatches, Listener } from "@modules/dispatcher";

type dispatches = {
	[key in keyof validDispatches]?: Listener<validDispatches[key]>;
} & {
	[key in keyof validDispatches as `once_${key}`]?: Listener<validDispatches[key]>;
};

export default class Store {
	constructor(dispatches: dispatches) {
		for (const [key, value] of Object.entries(dispatches)) {
			if (key.startsWith("once_")) {
				Dispatcher.once(key.slice(5) as keyof validDispatches, value);
			} else {
				Dispatcher.on(key as keyof validDispatches, value);
			}
		}

		if (window.isDev) {
			window.stores ??= {};
			window.stores[this.constructor.name] = this;
		}
	}
}
