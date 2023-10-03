import { Accessor, batch, createMemo, createRenderEffect, createSignal, JSX as _JSX, Match, onCleanup, ParentProps, Show, Switch } from "solid-js";
import { clamp } from "@solid-primitives/signal-builders";

import WindowStore from "@stores/window";

import { addLayer, removeLayer } from "@renderer/modules/layers";

export type ContextmenuItemProps = ParentProps<
	{
		color?: string;
		disabled?: boolean;
		propagate?: boolean;
	} & (
		| {
				action?: (event: Event) => void;
				icon?: (props: { size: number }) => _JSX.Element;
				type?: "text";
		  }
		| {
				action?: (event: Event) => void;
				type: "toggle";
				value: Accessor<boolean>;
		  }
		| {
				hide: () => void;
				menu: (hide: () => void, search: () => string) => _JSX.Element;
				search?: boolean;
				type: "submenu";
		  }
	)
>;

export function ContextmenuItem(props: ContextmenuItemProps): _JSX.Element {
	const [search, setSearch] = createSignal(""),
		toLower = createMemo(() => search().toLocaleLowerCase());
	return (
		<>
			<Switch>
				<Match when={props.type === "submenu" && props} keyed>
					{(props): _JSX.Element => (
						<>
							<input value={search()} onInput={(e): void => void setSearch((e.target as HTMLInputElement).value)} />
							{props.menu(props.hide, toLower)}
						</>
					)}
				</Match>
				<Match when={props.type === "toggle" && props} keyed>
					{(props): _JSX.Element => <div></div>}
				</Match>
				<Match when={(!props.type || props.type === "text") && props} keyed>
					{(props): _JSX.Element => <div></div>}
				</Match>
			</Switch>
		</>
	);
}

export type ContextmenuProps = {
	menu: (hide: () => void, search: () => string) => _JSX.Element;
	showOn?: string;
	topLevelSearch?: boolean;
};

const [alwaysTopLevel, setAlwaysTopLevel] = createSignal(true);

export default function ContextmenuDirective(element: Element, value: Accessor<ContextmenuProps>): void {
	let layerId: number | undefined;
	let menu: HTMLDivElement | undefined;

	const [x, setX] = createSignal(0),
		[y, setY] = createSignal(0),
		// eslint-disable-next-line solid/reactivity
		xClamped = clamp(x, 0, WindowStore.width() - (menu?.offsetWidth ?? 0)),
		// eslint-disable-next-line solid/reactivity
		yClamped = clamp(y, 0, () => WindowStore.height() - (menu?.offsetHeight ?? 0) - 10);

	function Menu(): _JSX.Element {
		const [search, setSearch] = createSignal(""),
			lower = createMemo(() => search().toLocaleLowerCase());

		return (
			<div
				ref={menu}
				class="contextmenu scroller scroller-auto"
				style={{
					left: xClamped() + "px",
					top: yClamped() + "px",
				}}
			>
				<Show when={value().topLevelSearch ?? alwaysTopLevel()}>
					<input value={search()} onInput={(e): void => void setSearch((e.target as HTMLInputElement).value)} />
				</Show>
				{value().menu(hide, lower)}
			</div>
		);
	}

	function show(e: MouseEvent): void {
		e.stopPropagation();
		if (layerId !== undefined) return;

		layerId = addLayer(Menu);

		document.addEventListener("mousedown", click);
		document.addEventListener("contextmenu", rightClick);

		batch(() => {
			setX(e.clientX);
			setY(e.clientY);
		});
	}

	function hide(): void {
		if (layerId !== undefined) {
			removeLayer(layerId);
			layerId = undefined;
		}

		document.removeEventListener("mousedown", click);
		document.removeEventListener("contextmenu", rightClick);
	}

	function click(e: MouseEvent): void {
		if (layerId === undefined) return;
		if (menu === e.target) return e.stopPropagation();
		if (
			!menu?.contains(
				(
					e as MouseEvent & {
						target: Element;
					}
				).target,
			)
		)
			return hide();
	}

	function rightClick(e: any): void {
		if (layerId === undefined) return;
		if (menu === e.target || menu?.contains(e.target)) return e.stopPropagation(), e.preventDefault();
		hide();
	}

	createRenderEffect(() => {
		// @ts-expect-error i dont care
		element.addEventListener(value().showOn || "contextmenu", show);

		onCleanup(() => {
			document.removeEventListener("click", click);
			document.removeEventListener("contextmenu", rightClick);
			hide();
		});
	});
}

declare module "solid-js" {
	// eslint-disable-next-line
	namespace JSX {
		interface Directives {
			ContextmenuDirective: ContextmenuProps;
		}
	}
}
