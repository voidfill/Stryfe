import { Accessor, batch, createEffect, createSignal, Setter } from "solid-js";
import { createStore, SetStoreFunction, Store, unwrap } from "solid-js/store";
import { Output, safeParse, SchemaWithFallback } from "valibot";

import { clear, entries, set } from "idb-keyval";

export default new (class PersistentStorage {
	stored: Record<string, { schema: SchemaWithFallback; setter: Setter<any> | SetStoreFunction<any>; transform?: (v: any) => any }> = {};
	isInitialized = false;

	constructor() {
		requestAnimationFrame(() => {
			this.init();
			this.isInitialized = true;
		});
	}

	init(): void {
		batch(async () => {
			for (const [k, v] of await entries()) {
				if (typeof k !== "string" || !this.stored[k]) continue;
				const { schema, setter, transform } = this.stored[k];

				const res = safeParse(schema, v);
				if (res.success) (setter as any)(transform ? transform(res.output) : res.output);
			}
		});
	}

	registerStore<T extends SchemaWithFallback>(
		key: string,
		verifier: T,
		transform?: (v: Output<T>) => Output<T>,
	): [Store<Output<T>>, SetStoreFunction<Output<T>>] {
		if (this.isInitialized) throw new Error("Cannot register store after initialization, please do it top-level");
		const [store, s] = createStore(verifier.fallback);
		this.stored[key] = { schema: verifier, setter: s, transform };

		const updater = (...args: any[]): void => {
			// @ts-expect-error what even
			s(...args);
			set(key, unwrap(store));
		};

		return [store, updater as typeof s];
	}

	registerSignal<T extends SchemaWithFallback>(
		key: string,
		verifier: T,
		transform?: (v: Output<T>) => Output<T>,
	): [Accessor<Output<T>>, Setter<Output<T>>] {
		if (this.isInitialized) throw new Error("Cannot register signal after initialization, please do it top-level");
		const [g, s] = createSignal(verifier.fallback);
		this.stored[key] = { schema: verifier, setter: s, transform };

		createEffect(() => {
			set(key, g());
		});

		return [g, s];
	}

	clear = clear;
})();
