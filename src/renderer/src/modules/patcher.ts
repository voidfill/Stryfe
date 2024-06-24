type anyFn = (...args: any[]) => any;

type unPatch = () => void;
type afterFn<T extends anyFn> = (result: ReturnType<T>) => ReturnType<T>;
type beforeFn<T extends anyFn> = (...args: Parameters<T>) => Parameters<T>;

type PatchableFunction<T extends anyFn> = T & {
	after: (f: afterFn<T>) => unPatch;
	before: (f: beforeFn<T>) => unPatch;
	instead: (f: T) => unPatch;
	original: T;
};

function patchable<T extends anyFn>(f: T): PatchableFunction<T> {
	let isPatched = false;
	const afterFns = new Set<afterFn<T>>();
	const beforeFns = new Set<beforeFn<T>>();
	let insteadFn: T | undefined;

	function patched(...args: Parameters<T>): ReturnType<T> {
		if (!isPatched) return f(...args);

		for (const beforeFn of beforeFns) {
			args = beforeFn(...args);
		}

		let result: ReturnType<T>;
		if (insteadFn) result = insteadFn(...args);
		else result = f(...args);

		for (const afterFn of afterFns) {
			result = afterFn(result);
		}

		return result;
	}

	function after(afterFn: afterFn<T>): unPatch {
		isPatched = true;
		afterFns.add(afterFn);
		return () => afterFns.delete(afterFn);
	}

	function before(beforeFn: beforeFn<T>): unPatch {
		isPatched = true;
		beforeFns.add(beforeFn);
		return () => beforeFns.delete(beforeFn);
	}

	function instead(i: T): unPatch {
		if (insteadFn) throw new Error("Instead function already set");

		isPatched = true;
		insteadFn = i;
		return () => {
			insteadFn = undefined;
		};
	}

	return Object.assign(patched, { after, before, instead, original: f }) as PatchableFunction<T>;
}

const p = patchable;

export { patchable, p };
