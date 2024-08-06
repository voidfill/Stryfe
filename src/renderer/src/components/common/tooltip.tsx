import { Accessor, createEffect, createSignal, JSX, onCleanup, Show, untrack } from "solid-js";

import "tippy.js/dist/svg-arrow.css";
import "tippy.js/animations/scale.css";
import "tippy.js/animations/scale-subtle.css";
import "./tooltip.css";

import makeTippy, { hideAll, Props, roundArrow } from "tippy.js";
import makeHeadlessTippy from "tippy.js/headless";

type _p = {
	content: () => JSX.Element;
	disabled?: boolean;
	props?: Partial<DistributiveOmit<Props, "content" | "onShow" | "onHidden">>; // cba dealing with setting this up, its conditionally rendered already
};

type p = _p | (() => JSX.Element);

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			headlessTippy: p;
			tippy: p;
		}
	}
}

makeTippy.setDefaultProps({
	arrow: roundArrow,
	delay: 0,
	duration: 0,
	maxWidth: "",
	theme: "standard",
	trigger: "mouseenter",
});

window.addEventListener(
	"mousewheel",
	() => {
		hideAll({ duration: 0 });
	},
	{
		capture: true,
		passive: true,
	},
);

function tippyFactory(tippyProducer: typeof makeTippy): (target: Element, props: Accessor<p>) => void {
	return (target, _props) => {
		const props = (): _p => {
			const p = _props();
			return typeof p === "function" ? { content: p } : p;
		};

		const [isOpen, setIsOpen] = createSignal(false);
		function ToShow(): JSX.Element {
			// lazy eval wrapper
			return (
				<div>
					<Show when={isOpen()}>{props().content()}</Show>
				</div>
			);
		}
		const instance = untrack(() =>
			tippyProducer(target, {
				...props().props,
				content: ToShow as any,
				onHidden: () => void setIsOpen(false),
				onShow: () => void setIsOpen(true),
			}),
		);

		createEffect(() => {
			instance.setProps(props().props ?? {});
		});

		createEffect(() => {
			if (props().disabled) {
				instance.disable();
			} else {
				instance.enable();
			}
		});

		onCleanup(() => {
			instance.destroy();
		});
	};
}

const tippy = tippyFactory(makeTippy);
const headlessTippy = tippyFactory(makeHeadlessTippy);

export default tippy;
export { tippy, headlessTippy };
