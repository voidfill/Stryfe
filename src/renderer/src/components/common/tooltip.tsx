import { Accessor, createEffect, createSignal, JSX, onCleanup, Show, untrack } from "solid-js";

import "tippy.js/dist/svg-arrow.css";
import "tippy.js/animations/scale.css";
import "tippy.js/animations/scale-subtle.css";
import "./tooltip.scss";

import makeTippy, { hideAll, Props, roundArrow } from "tippy.js";
import makeHeadlessTippy from "tippy.js/headless";

type p = {
	content: () => JSX.Element;
	disabled?: boolean;
	props?: Partial<DistributiveOmit<Props, "content" | "onShow" | "onHidden">>; // cba dealing with setting this up, its conditionally rendered already
};

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
	"scroll",
	() => {
		hideAll({ duration: 0 });
	},
	true,
);

function tippyFactory(tippyProducer: typeof makeTippy): (target: Element, props: Accessor<p>) => void {
	return (target, props) => {
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
