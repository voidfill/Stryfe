import { createMemo, JSX, mergeProps, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { addLayer, removeLayer } from "@modules/layers";

import "./modal.scss";

import { Transition } from "solid-transition-group";
1;

type modalProps = {
	animationOptions?: KeyframeAnimationOptions;
	content: (close: () => void) => JSX.Element;
	noClickOutside?: boolean; // TODO: Implement functionality, needed for notices, captchas etc
};

let nextId = 1;
const [stack, setStack] = createStore<number[]>([]);

const defaultAnimationOptions: KeyframeAnimationOptions = {
	duration: 450,
	easing: "cubic-bezier(0.25, 1, 0.5, 1)",
};

export function createModal(props: modalProps): void {
	const id = nextId++;
	setStack(produce((p) => p.push(id)));
	let layerId: undefined | number;
	const withDefaults = mergeProps({ animationOptions: defaultAnimationOptions }, props);

	const isVisible = createMemo(() => stack[stack.length - 1] === id);

	function closeSelf(): void {
		setStack((p) => p.filter((i) => i !== id));
	}

	async function onExit(modalRoot: Element, done: () => void): Promise<void> {
		const [wrapper] = modalRoot.children;

		await Promise.allSettled([
			modalRoot.animate([{ opacity: 1 }, { opacity: 0 }], withDefaults.animationOptions).finished,
			wrapper.animate([{ transform: "scale(1)" }, { transform: "scale(0.5)" }], withDefaults.animationOptions).finished,
		]);

		done();
	}

	async function onEnter(modalRoot: Element, done: () => void): Promise<void> {
		const [wrapper] = modalRoot.children;

		await Promise.allSettled([
			modalRoot.animate([{ opacity: 0 }, { opacity: 1 }], withDefaults.animationOptions).finished,
			wrapper.animate([{ transform: "scale(0.5)" }, { transform: "scale(1)" }], withDefaults.animationOptions).finished,
		]);

		done();
	}

	function Menu(): JSX.Element {
		return (
			<Transition
				appear
				name="modal-scale"
				onEnter={onEnter}
				onExit={onExit}
				onAfterExit={() => {
					layerId &&= void removeLayer(layerId);
				}}
			>
				<Show when={isVisible()}>
					<div class="modal-root" onClick={(e) => e.target === e.currentTarget && closeSelf()}>
						<div class="modal-wrapper">{props.content(() => void 0)}</div>
					</div>
				</Show>
			</Transition>
		);
	}

	layerId = addLayer(Menu);
}

document.addEventListener("keydown", (e) => {
	if (e.key !== "Escape") return;
	if (stack.length === 0) return;
	setStack(produce((p) => p.pop())); // TODO: dont if modal has no reject, somehow.
});
