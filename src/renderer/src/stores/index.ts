import Dispatcher, { dispatches as validDispatches } from "@modules/dispatcher";

type dispatchesWithArgs = OmitByType<validDispatches, undefined>;
type dispatchesWithoutArgs = PickByType<validDispatches, undefined>;

type dispatches = {
	[key in keyof dispatchesWithArgs]: (args: dispatchesWithArgs[key]) => void;
} & {
	[key in keyof dispatchesWithoutArgs]: () => void;
} & {
	[key in keyof dispatchesWithArgs as `once_${key}`]: (args: dispatchesWithArgs[key]) => void;
} & {
	[key in keyof dispatchesWithoutArgs as `once_${key}`]: () => void;
};

export default class Store {
	#__registeredDispatches = new Set<() => void>();

	constructor(dispatches: Partial<dispatches>) {
		for (const [key, value] of Object.entries(dispatches)) {
			if (key.startsWith("once_")) {
				this.#__registeredDispatches.add(Dispatcher.once(key.slice(5) as keyof validDispatches, value));
			} else {
				this.#__registeredDispatches.add(Dispatcher.on(key as keyof validDispatches, value));
			}
		}

		if (window.isDev) {
			window.stores ??= {};
			window.stores[this.constructor.name] = this;
		}
	}

	__kill(): void {
		for (const remove of this.#__registeredDispatches) remove();
	}
}
