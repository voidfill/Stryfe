import { Accessor, createEffect, createSignal, JSX as _JSX, onCleanup, Show } from "solid-js";

import makeTippy from "tippy.js";

export default function OverflowTooltip(el: Element, props: Accessor<() => _JSX.Element>): void {
	const [isOverflowing, setOverflowing] = createSignal(el.scrollWidth > el.clientWidth);
	const [isOpen, setIsOpen] = createSignal(false);
	const observer = new ResizeObserver(() => {
		setOverflowing(el.scrollWidth > el.clientWidth);
	});
	observer.observe(el);

	function ToShow(): _JSX.Element {
		// lazy eval wrapper
		return (
			<div>
				<Show when={isOpen()}>{props()()}</Show>
			</div>
		);
	}

	const instance = makeTippy(el, {
		animation: "scale-subtle",
		content: ToShow as any,
		delay: [300, null],
		onHidden: () => void setIsOpen(false),
		onShow: () => void setIsOpen(true),
	});

	createEffect(() => {
		if (isOverflowing()) instance.enable();
		else instance.disable();
	});

	onCleanup(() => {
		observer.disconnect();
		instance.destroy();
	});
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			OverflowTooltip: Accessor<_JSX.Element>;
		}
	}
}
