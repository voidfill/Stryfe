import Dispatcher, { dispatches as validDispatches, Listener } from "@modules/dispatcher";

type dispatches = {
	[key in keyof validDispatches]: Listener<validDispatches[key]>;
} & {
	[key in keyof validDispatches as `once_${key}`]: Listener<validDispatches[key]>;
};

export default class Store {
	#__registeredDispatches = new Set<() => void>();

	constructor(dispatches: Partial<dispatches>) {
		for (const [key, value] of Object.entries(dispatches)) {
			if (key.startsWith("once_")) {
				// @ts-expect-error yea.
				this.#__registeredDispatches.add(Dispatcher.once(key.slice(5) as keyof validDispatches, value));
			} else {
				// @ts-expect-error yea.
				this.#__registeredDispatches.add(Dispatcher.on(key as keyof validDispatches, value));
			}
		}

		registerDebugStore(this.constructor.name, this);
	}

	__kill(): void {
		for (const remove of this.#__registeredDispatches) remove();
	}
}

if (window.isDev) window.stores = {};

export function registerDebugStore(name: string, target: object): void {
	if (window.stores) window.stores[name] = target;
}
