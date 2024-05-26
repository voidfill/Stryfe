import {
	Accessor,
	createContext,
	createEffect,
	createMemo,
	createRenderEffect,
	createSelector,
	createSignal,
	For,
	JSX,
	onCleanup,
	onMount,
	Show,
	untrack,
	useContext,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";

import { FaSolidChevronRight } from "solid-icons/fa";

import "./contextmenu.scss";

import { addLayer, removeLayer } from "@renderer/modules/layers";

export enum Colors {
	PRIMARY = "primary",
	RED = "red",
	GREEN = "green",
	YELLOW = "yellow",
}

const ctxmenuPadding = 8;

const getUniqueId = (() => {
	let id = 0n;
	return (): string => `ctx-${id++}`;
})();

const searchTerms = new ReactiveMap<string, string>();
const refMap = new ReactiveMap<string, Element>();
const parentMap = new Map<string, string>();

type context = {
	get: () => string;
	hide: () => void;
	is: (id: string) => boolean;
	off: (id: string) => void;
	on: (id: string) => void;
};

type genericProps = {
	action?: () => boolean | void; // return a truthy value to keep the menu open
	color?: Colors;
	disabled?: boolean;
	icon?: ((props: { size: number }) => JSX.Element) | JSX.Element;
	label: string;
	subText?: string;
};

type parentRect = {
	height: number;
	width: number;
	x: number;
	y: number;
};

const menuContext = createContext<context>({ get: () => "", hide: () => {}, is: () => false, off: () => {}, on: () => {} });

function clamp(num: number, min: number, max: number): number {
	return num <= min ? min : num >= max ? max : num;
}

function Wrapper(props: { children: JSX.Element; for: string; parentRect: parentRect; ref?: (r: Element) => void; toplevel: boolean }): JSX.Element {
	let ref: HTMLElement | undefined;
	const [x, setX] = createSignal(0);
	const [y, setY] = createSignal(0);

	onMount(() => {
		setY(clamp(props.parentRect.y, 0, window.innerHeight - ref!.offsetHeight - ctxmenuPadding));
		if (props.parentRect.x + props.parentRect.width + ref!.offsetWidth > window.innerWidth - ctxmenuPadding) {
			setX(clamp(props.parentRect.x - ref!.offsetWidth, 0, window.innerWidth - ref!.offsetWidth - ctxmenuPadding));
		} else {
			setX(clamp(props.parentRect.x + props.parentRect.width, 0, window.innerWidth - ref!.offsetWidth - ctxmenuPadding));
		}
	});

	return (
		<div
			ref={(r) => {
				ref = r;
				props.ref?.(r);
			}}
			classList={{ "ctx-toplevel": props.toplevel, "ctx-wrapper": true }}
			style={{
				left: `${x()}px`,
				top: `${y()}px`,
			}}
			data-wrapper-for={props.for}
		>
			<div class="ctx-wrapper-inner" data-wrapper-for={props.for}>
				{props.children}
			</div>
		</div>
	);
}

function Search(props: { for: string }): JSX.Element {
	const { is, off, on } = useContext(menuContext);
	const [r, sr] = createSignal<HTMLInputElement | undefined>(undefined);
	const selfId = createMemo(() => props.for + "-search");

	onMount(() => {
		parentMap.set(selfId(), props.for);

		createEffect(() => {
			if (!r()) return;
			if (is(selfId())) r()!.focus();
			else r()!.blur();
		});
	});

	onCleanup(() => {
		searchTerms.delete(props.for);
		refMap.delete(selfId());
		off(selfId());
		parentMap.delete(selfId());
	});

	return (
		<input
			classList={{ "ctx-search": true, selected: is(selfId()) }}
			id={selfId()}
			ref={(r) => {
				sr(r);
				refMap.set(selfId(), r);
			}}
			onInput={(e) => searchTerms.set(props.for, e.currentTarget.value.trim().toLowerCase())}
			onMouseEnter={() => on(selfId())}
			onMouseLeave={() => off(selfId())}
		/>
	);
}

function MenuItem(
	props: genericProps & {
		id: string;
		ref?: (r: Element) => void;
		subMenu?: boolean;
		subMenuItems?: JSX.Element;
	},
): JSX.Element {
	const { off, on, is, get, hide } = useContext(menuContext);

	const [r, sr] = createSignal<Element | undefined>(undefined);
	const [parentId, setParentId] = createSignal<string | undefined>(undefined);
	const isVisible = createMemo(() => {
		const parent = parentId();
		if (!parent) return true;
		const search = searchTerms.get(parent);
		if (!search?.length) return true;
		return props.label.toLowerCase().includes(search);
	});
	const subMenuVisible = createMemo(() => {
		if (!props.subMenu) return false;
		if (is(props.id)) return true;
		const el = refMap.get(get());
		if (!el) return false;
		return r()?.contains(el) ?? false;
	});

	createEffect(() => {
		const parentId = r()?.parentElement?.getAttribute("data-wrapper-for");
		if (!parentId) return;
		setParentId(parentId);
		parentMap.set(props.id, parentId);
	});

	onCleanup(() => {
		off(props.id);
		refMap.delete(props.id);
		parentMap.delete(props.id);
	});

	createEffect(() => {
		if (props.disabled) off(props.id);
	});

	return (
		<Show when={isVisible()}>
			<div
				ref={(r) => {
					sr(r);
					props.ref?.(r);
					refMap.set(props.id, r);
				}}
				classList={{
					[`color-${props.color ?? Colors.PRIMARY}`]: true,
					"ctx-menu-item": true,
					"ctx-submenu": !!props.subMenu,
					disabled: props.disabled,
					selected: is(props.id),
				}}
				id={props.id}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (props.disabled || !props.action) return;
					if (props.action()) return;
					hide();
				}}
				onMouseEnter={() => !props.disabled && on(props.id)}
				onMouseLeave={() => off(props.id)}
			>
				<div class="ctx-text">
					<span class="ctx-label">{props.label}</span>
					<Show when={props.subText}>
						<span class="ctx-sub-text">{props.subText}</span>
					</Show>
				</div>
				<Show when={props.icon}>
					<div class="ctx-icon">{typeof props.icon === "function" ? props.icon!({ size: 16 }) : props.icon}</div>
				</Show>
				<Show when={subMenuVisible()}>{props.subMenuItems}</Show>
			</div>
		</Show>
	);
}

export function SubMenu(props: genericProps & { children: JSX.Element; searchable?: boolean }): JSX.Element {
	const id = getUniqueId();
	const [r, sr] = createSignal<Element | undefined>(undefined);

	return (
		<MenuItem
			id={id}
			label={props.label}
			subText={props.subText}
			disabled={props.disabled}
			action={props.action}
			color={props.color}
			ref={sr}
			subMenu
			subMenuItems={
				<Wrapper
					children={
						<>
							<Show when={props.searchable}>
								<Search for={id} />
							</Show>
							{props.children}
						</>
					}
					for={id}
					parentRect={r()!.getBoundingClientRect()}
					toplevel={false}
				/>
			}
			icon={<FaSolidChevronRight size={12} />}
		/>
	);
}

export function Item(props: genericProps): JSX.Element {
	const id = getUniqueId();
	return <MenuItem id={id} {...props} />;
}

export function Separator(): JSX.Element {
	return <div class="ctx-separator" />;
}

export function Id(props: { id: string; of?: string }): JSX.Element {
	return <Item label={`Copy ${props.of ? props.of + " " : ""}ID`} action={() => void navigator.clipboard.writeText(props.id)} />;
}

function Check(props: { enabled: boolean; type: "radio" | "checkbox" }): JSX.Element {
	// TODO: Implement checkbox, styling
	return <input class="ctx-radio" type="radio" checked={props.enabled} />;
}

export function Choice<T>(props: { choices: { label: string; value: T }[]; color?: Colors; get: Accessor<T>; set: (v: T) => void }): JSX.Element {
	return (
		<For each={props.choices}>
			{({ label, value }) => (
				<Item
					label={label}
					action={() => {
						props.set(value);
						return true;
					}}
					color={props.color}
					icon={<Check enabled={props.get() === value} type="radio" />}
				/>
			)}
		</For>
	);
}

export function Switch(props: {
	color?: Colors;
	enabled: Accessor<boolean>;
	label: string;
	set: (v: boolean) => void;
	subText?: string;
}): JSX.Element {
	return (
		<Item
			label={props.label}
			action={() => {
				props.set(!props.enabled());
				return true;
			}}
			color={props.color}
			icon={<Check enabled={props.enabled()} type="checkbox" />}
			subText={props.subText}
		/>
	);
}

export function ContextmenuDirective(
	element: Element,
	value: Accessor<{ menu: () => JSX.Element; on?: "click" | "contextmenu"; searchable?: boolean }>,
): void {
	let layerId: number | undefined;
	const id = getUniqueId();
	const [r, sr] = createSignal<Element | undefined>(undefined);

	const [stack, setStack] = createStore<string[]>([]);

	let ignoreOn = false;
	function on(id: string): void {
		if (ignoreOn) return;
		setStack(
			produce((s) => {
				if (s.length === 0) return void s.push(id);
				if (stack[stack.length - 1] === id) return;
				for (const i of s) {
					if (i === id) return;
				}
				const parents = s.map((i) => parentMap.get(i));
				const idx = parents.indexOf(parentMap.get(id));
				if (idx === -1) return void s.push(id);
				s.splice(idx, 1);
				s.push(id);
			}),
		);
	}
	function off(id: string): void {
		setStack(
			produce((s) => {
				if (s.length === 0) return;
				if (stack[stack.length - 1] === id) return void s.pop();
				for (let i = s.length - 1; i >= 0; i--) {
					if (s[i] === id) {
						s.splice(i, 1);
						return;
					}
				}
			}),
		);
	}
	function get(): string {
		if (stack.length === 0) return "";
		return stack[stack.length - 1];
	}
	const is = createSelector(get);

	function hide(): void {
		if (layerId !== undefined) layerId = void removeLayer(layerId);
		setStack([]);
		window.removeEventListener("resize", hide);
		document.removeEventListener("mousedown", clickOutsideHandler);
		document.removeEventListener("contextmenu", clickOutsideHandler);
		document.removeEventListener("keydown", kbNavHandler);
	}

	function contextmenuHandler(e: MouseEvent): void {
		e.preventDefault();
		e.stopImmediatePropagation();
		window.addEventListener("resize", hide);
		document.addEventListener("mousedown", clickOutsideHandler);
		document.addEventListener("contextmenu", clickOutsideHandler);
		document.addEventListener("keydown", kbNavHandler);

		const dr: parentRect = {
			height: 1,
			width: 1,
			x: e.clientX,
			y: e.clientY,
		};

		layerId = addLayer(() => (
			<menuContext.Provider value={{ get, hide, is, off, on }}>
				<Wrapper
					children={
						<>
							<Show when={value().searchable}>
								<Search for={id} />
							</Show>
							{value().menu()}
						</>
					}
					for={id}
					parentRect={dr}
					ref={sr}
					toplevel={true}
				/>
			</menuContext.Provider>
		));
	}

	function clickOutsideHandler(e: MouseEvent): void {
		const menu = r();
		if (layerId === undefined || !menu) return;
		if (menu === e.target) return e.stopPropagation(), e.preventDefault();
		if (!menu.contains(e.target as Node)) hide();
	}

	const movementKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
	function kbNavHandler(e: KeyboardEvent): void {
		if (e.key === "Escape") hide();

		// @ts-expect-error nodeName does exist.
		if (e.target?.nodeName === "INPUT" && !movementKeys.has(e.key)) return;
		else {
			e.preventDefault();
			e.stopPropagation();
		}

		const el = refMap.get(get());
		if (e.key === "Enter" || e.key === " ") {
			// @ts-expect-error bla
			if (el) el.click?.();
			return;
		}
		if (!movementKeys.has(e.key)) return;

		function kbOn(el: Element): void {
			ignoreOn = true;
			el.scrollIntoView({ behavior: "instant", block: "nearest" });
			requestAnimationFrame(() => {
				ignoreOn = false;
				on(el.id);
			});
			// @ts-expect-error bla
			if (el.id.endsWith("-search")) el.focus?.();
		}
		function kbOff(el: Element): void {
			off(el.id);
			// @ts-expect-error bla
			if (el.id.endsWith("-search")) el.blur?.();
		}

		function isValid(el: Element | null | undefined): boolean {
			return el && el.id && el.id.startsWith("ctx-") && !el.classList.contains("disabled") ? true : false;
		}

		if (!el) {
			switch (e.key) {
				case "ArrowDown":
				case "ArrowRight":
				case "ArrowLeft": {
					let child = r()?.firstElementChild?.firstElementChild;
					if (!child) return;
					while (child && !isValid(child)) child = child.nextElementSibling;
					if (!child || !isValid(child)) return;
					kbOn(child);
					break;
				}
				case "ArrowUp": {
					let child = r()?.firstElementChild?.lastElementChild;
					if (!child) return;
					while (child && !isValid(child)) child = child.previousElementSibling;
					if (!child || !isValid(child)) return;
					kbOn(child);
					break;
				}
			}
			return;
		}

		const parent = el.parentElement;
		if (!parent) return;

		switch (e.key) {
			case "ArrowUp": {
				let sib = el.previousElementSibling;
				while (sib && !isValid(sib)) sib = sib.previousElementSibling;
				if (!sib) {
					sib = parent.lastElementChild;
					while (sib && !isValid(sib)) sib = sib.previousElementSibling;
					if (!sib || sib === el || !isValid(sib)) return;
				}
				kbOff(el);
				kbOn(sib);
				break;
			}
			case "ArrowDown": {
				let sib = el.nextElementSibling;
				while (sib && !isValid(sib)) sib = sib.nextElementSibling;
				if (!sib) {
					sib = parent.firstElementChild;
					while (sib && !isValid(sib)) sib = sib.nextElementSibling;
					if (!sib || sib === el || !isValid(sib)) return;
				}
				kbOff(el);
				kbOn(sib);
				break;
			}
			case "ArrowLeft": {
				const parent = parentMap.get(el.id);
				if (!parent) return;
				const parentEl = refMap.get(parent);
				if (!parentEl) return;
				kbOff(el);
				kbOn(parentEl);
				break;
			}
			case "ArrowRight": {
				if (!el.classList.contains("ctx-submenu") || el.classList.contains("disabled")) return;
				let sub = el.lastElementChild?.firstElementChild?.firstElementChild;
				if (!sub) return;
				while (sub && !isValid(sub)) sub = sub.nextElementSibling;
				if (!sub || !isValid(sub)) return;
				kbOn(sub);
			}
		}
	}

	createRenderEffect(() => {
		element.addEventListener(untrack(() => value().on) ?? "contextmenu", contextmenuHandler as (e: Event) => void);

		onCleanup(() => {
			hide();
			element.removeEventListener(untrack(() => value().on) ?? "contextmenu", contextmenuHandler as (e: Event) => void);

			window.removeEventListener("resize", hide);
			document.removeEventListener("mousedown", clickOutsideHandler);
			document.removeEventListener("contextmenu", clickOutsideHandler);
			document.removeEventListener("keydown", kbNavHandler);
		});
	});
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			ContextmenuDirective: ReturnType<Parameters<typeof ContextmenuDirective>[1]>;
		}
	}
}
