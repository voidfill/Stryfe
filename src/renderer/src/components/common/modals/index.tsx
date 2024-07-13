import { Accessor, createContext, createSelector, FlowProps, JSX, onCleanup, Show, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { addLayer, removeLayer } from "@modules/layers";

import { AiOutlineCloseCircle } from "solid-icons/ai";

import "./style.scss";

import { Transition } from "solid-transition-group";
1;

type modalProps = {
	animationOptions?: KeyframeAnimationOptions;
	content: (close: () => void) => JSX.Element;
	noDismiss?: boolean;
};

let nextId = 1;
// [id, noDismiss]
const [stack, setStack] = createStore<[number, boolean][]>([]);
const visible = createSelector(() => stack[stack.length - 1]?.[0]);

const defaultAnimationOptions: KeyframeAnimationOptions = {
	duration: 450,
	easing: "cubic-bezier(0.25, 1, 0.5, 1)",
};

export const ModalContext = createContext<() => void>(() => {});
export const useModalContext = (): (() => void) => useContext(ModalContext);

export function createModal(opts: modalProps): () => void {
	const withDefaults = Object.assign({ animationOptions: defaultAnimationOptions, noDismiss: false }, opts);
	const id = nextId++;
	let layerId: undefined | number;

	setStack(produce((p) => p.push([id, withDefaults.noDismiss])));

	function closeSelf(): void {
		setStack((p) => p.filter(([i]) => i !== id));
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
				onBeforeEnter={() => {
					layerId ||= addLayer(Menu);
				}}
			>
				<Show when={visible(id)}>
					<ModalContext.Provider value={closeSelf}>
						<div class="modal-root" onClick={(e) => !withDefaults.noDismiss && e.target === e.currentTarget && closeSelf()}>
							<div class="modal-wrapper">{opts.content(closeSelf)}</div>
						</div>
					</ModalContext.Provider>
				</Show>
			</Transition>
		);
	}

	layerId = addLayer(Menu);

	return closeSelf;
}

export function ModalDirective(el: Element, value: Accessor<modalProps & { on?: string }>): void {
	let close: () => void | undefined;

	function handler(): void {
		close = createModal(value());
	}

	el.addEventListener(value().on || "click", handler);

	onCleanup(() => {
		el.removeEventListener(value().on || "click", handler);
		close?.();
	});
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			ModalDirective: ReturnType<Parameters<typeof ModalDirective>[1]>;
		}
	}
}

document.addEventListener("keydown", (e) => {
	if (e.key !== "Escape") return;
	if (stack.length === 0) return;
	if (stack[stack.length - 1][1]) return;
	setStack(produce((p) => p.pop()));
});

export function GenericModal(props: FlowProps<{ class?: string }>): JSX.Element {
	return <div classList={{ "modal-generic": true, [props.class!]: !!props.class }}>{props.children}</div>;
}

export function ModalFooter(props: FlowProps): JSX.Element {
	return <div class="modal-footer">{props.children}</div>;
}

export function ModalBody(props: FlowProps): JSX.Element {
	return <div class="modal-body">{props.children}</div>;
}

export function ModalHeader(props: { closeButton?: boolean; subtitle?: string; title: string }): JSX.Element {
	const close = useModalContext();

	return (
		<div class="modal-header">
			<div class="modal-title">
				<h3>{props.title}</h3>
				<Show when={props.subtitle}>
					<h4>{props.subtitle}</h4>
				</Show>
			</div>
			<Show when={props.closeButton}>
				<AiOutlineCloseCircle class="modal-close" onClick={close} size={34} />
			</Show>
		</div>
	);
}
