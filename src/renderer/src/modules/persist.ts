import { Accessor, batch, createSignal, Setter, untrack } from "solid-js";
import { createStore, SetStoreFunction, Store, StoreSetter, unwrap } from "solid-js/store";
import { BaseIssue, BaseSchema, Fallback, InferOutput, safeParse, SchemaWithFallback } from "valibot";

import { clear, entries, get, set } from "idb-keyval";

type unknownFallbackSchema = SchemaWithFallback<
	BaseSchema<unknown, unknown, BaseIssue<unknown>>,
	Fallback<BaseSchema<unknown, unknown, BaseIssue<unknown>>>
>;

const stored: Record<string, { schema: unknownFallbackSchema; setter: Setter<any> | SetStoreFunction<any>; transform?: (v: any) => any }> = {};
let hasInitialized = false;

queueMicrotask(() => {
	hasInitialized = true;
	initialize();
});

function initialize(): void {
	batch(async () => {
		for (const [k, v] of await entries()) {
			if (typeof k !== "string" || !stored[k]) continue;
			const { schema, setter, transform } = stored[k];

			const res = safeParse(schema, v);
			if (res.success) (setter as any)(transform ? transform(res.output) : res.output);
		}
	});
}

function persistStore<T extends unknownFallbackSchema>(
	key: string,
	verifier: T,
	transform?: (v: InferOutput<T>) => InferOutput<T>,
): [Store<InferOutput<T>>, SetStoreFunction<InferOutput<T>>] {
	// @ts-expect-error sigh.
	const [store, s] = createStore(verifier.fallback);
	if (hasInitialized) {
		get(key).then((v) => {
			const res = safeParse(verifier, v);
			if (res.success) s((transform ? transform(res.output) : res.output) as any);
		});
	}
	stored[key] = { schema: verifier, setter: s, transform };

	const updater: StoreSetter<InferOutput<T>> = (...args): void => {
		// @ts-expect-error what even
		s(...args);
		set(key, unwrap(store));
	};

	// @ts-expect-error sigh.
	return [store, updater as StoreSetter<InferOutput<T>>];
}

function persistSignal<T extends unknownFallbackSchema>(
	key: string,
	verifier: T,
	transform?: (v: InferOutput<T>) => InferOutput<T>,
): [Accessor<InferOutput<T>>, Setter<InferOutput<T>>] {
	const [g, s] = createSignal(verifier.fallback);
	if (hasInitialized) {
		get(key).then((v) => {
			const res = safeParse(verifier, v);
			if (!res.success) return;
			// @ts-expect-error sigh.
			s(transform ? transform(res.output) : res.output);
		});
	}
	stored[key] = { schema: verifier, setter: s, transform };

	const updater = (...args: any[]): any => {
		// @ts-expect-error what even
		const res = s(...args);
		set(key, untrack(g));
		return res;
	};

	return [g, updater as typeof s];
}

export { clear, persistSignal, persistStore };
