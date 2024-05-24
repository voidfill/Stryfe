import { Accessor, batch, createSignal, Setter, untrack } from "solid-js";
import { createStore, SetStoreFunction, Store, unwrap } from "solid-js/store";
import { Output, safeParse, SchemaWithFallback } from "valibot";

import { clear, entries, get, set } from "idb-keyval";

export default new (class PersistentStorage {
	stored: Record<string, { schema: SchemaWithFallback; setter: Setter<any> | SetStoreFunction<any>; transform?: (v: any) => any }> = {};
	hasInitialized = false;

	constructor() {
		queueMicrotask(() => {
			this.init();
			this.hasInitialized = true;
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
		const [store, s] = createStore(verifier.fallback);
		if (this.hasInitialized) {
			get(key).then((v) => {
				const res = safeParse(verifier, v);
				if (res.success) s(transform ? transform(res.output) : res.output);
			});
		}
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
		const [g, s] = createSignal(verifier.fallback);
		if (this.hasInitialized) {
			get(key).then((v) => {
				const res = safeParse(verifier, v);
				if (res.success) s(transform ? transform(res.output) : res.output);
			});
		}
		this.stored[key] = { schema: verifier, setter: s, transform };

		const updater = (...args: any[]): any => {
			// @ts-expect-error what even
			const res = s(...args);
			set(key, untrack(g));
			return res;
		};

		return [g, updater as typeof s];
	}

	clear = clear;
})();
