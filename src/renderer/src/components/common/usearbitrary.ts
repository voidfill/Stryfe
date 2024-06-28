type f = (...args: any[]) => any;

type t = [f, any] | f | undefined;

export function arbitrary(el: Element, props: () => t[]): void {
	for (const item of props()) {
		if (!item) continue;

		if (Array.isArray(item)) {
			const [fn, args] = item;
			fn(el, () => args);
		} else if (item) {
			item(el);
		}
	}
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			arbitrary: t[];
		}
	}
}
