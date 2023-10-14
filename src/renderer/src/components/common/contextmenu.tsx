import { type Accessor, createEffect, createMemo, createRenderEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { type JSX as sJSX } from "solid-js/jsx-runtime";

import { addLayer, removeLayer } from "@modules/layers";

import { BiSolidCopyAlt } from "solid-icons/bi";
import { FaSolidChevronRight } from "solid-icons/fa";

import "./contextmenu.scss";

declare module "solid-js" {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace JSX {
		interface Directives {
			ContextmenuDirective: contextmenuProps;
		}
	}
}

const ctxmenuPadding = 8;

export enum Colors {
	PRIMARY = "primary",
	RED = "red",
	GREEN = "green",
	YELLOW = "yellow",
}

type menuItem =
	| ({
			action: () => void;
			color?: Colors;
			label: string;
	  } & (
			| {
					disabled?: boolean;
					type: "text";
			  }
			| {
					disabled?: boolean;
					icon: (props: { size: number }) => sJSX.Element;
					type: "icon";
			  }
			| {
					searchable?: boolean;
					submenu: menuItem[];
					type: "submenu";
			  }
			| {
					enabled: Accessor<boolean>;
					type: "switch";
			  }
	  ))
	| {
			type: "separator";
	  };

export const Separator: menuItem = {
	type: "separator",
};

export const Id = (id: string, name: string): menuItem => ({
	action: () => navigator.clipboard.writeText(id),
	icon: BiSolidCopyAlt,
	label: name,
	type: "icon",
});

export function Optional(bool: boolean, element: menuItem | menuItem[]): menuItem[] {
	return bool ? (Array.isArray(element) ? element : [element]) : [];
}

type contextmenuProps = {
	menu: menuItem[];
	searchable?: boolean;
	showOn?: "contextmenu" | "click";
};

function clamp(num: number, min: number, max: number): number {
	return num <= min ? min : num >= max ? max : num;
}

function Menu(props: {
	hide: () => void;
	id: string;
	isSubmenu?: boolean;
	menu: menuItem[];
	onmouseenter: () => void;
	onmouseleave: () => void;
	parentRect: DOMRect;
	ref: (e: HTMLDivElement) => void;
	searchable?: boolean;
	selectedItem: [Accessor<string>, (next: string) => void];
}): sJSX.Element {
	let mref: HTMLDivElement | undefined;

	const [x, setX] = createSignal(0);
	const [y, setY] = createSignal(0);

	onMount(() => {
		setY(clamp(props.parentRect.y, 0, window.innerHeight - mref!.offsetHeight - ctxmenuPadding));
		if (props.parentRect.x + props.parentRect.width + mref!.offsetWidth > window.innerWidth - ctxmenuPadding) {
			setX(
				clamp(
					props.parentRect.x - mref!.offsetWidth + (props.isSubmenu ? ctxmenuPadding * -0.5 : 0),
					0,
					window.innerWidth - mref!.offsetWidth - ctxmenuPadding,
				),
			);
		} else {
			setX(
				clamp(
					props.parentRect.x + props.parentRect.width + (props.isSubmenu ? ctxmenuPadding * 0.5 : 0),
					0,
					window.innerWidth - mref!.offsetWidth - ctxmenuPadding,
				),
			);
		}

		createEffect(() => {
			if (props.searchable && props.selectedItem[0]() === searchRef?.id) {
				searchRef?.focus();
			}
		});
	});

	let searchRef: HTMLInputElement | undefined;
	const [search, setSearch] = createSignal("");
	const lower = createMemo(() => search().toLowerCase());

	onCleanup(() => {
		searchRef?.blur();
	});

	return (
		<div
			ref={(e): void => {
				mref = e;
				props.ref(e);
			}}
			classList={{
				ctxmenu: true,
				submenu: props.isSubmenu,
			}}
			style={{
				"--padding": `${ctxmenuPadding}px`,
				left: `${x()}px`,
				position: "fixed",
				top: `${y()}px`,
			}}
			// eslint-disable-next-line solid/reactivity
			onMouseEnter={/* @once */ props.onmouseenter}
			// eslint-disable-next-line solid/reactivity
			onMouseLeave={/* @once */ props.onmouseleave}
		>
			<div class="ctxmenu-bg">
				<Show when={props.searchable}>
					<input
						id={props.id + "-search"}
						type="text"
						ref={searchRef}
						value={search()}
						onInput={(e): void => {
							props.selectedItem[1](props.id);
							setSearch(e.currentTarget.value);
						}}
						onMouseEnter={(): void => {
							props.selectedItem[1](props.id);
							searchRef?.focus();
						}}
						onMouseLeave={(): void => {
							props.selectedItem[1](props.id);
							searchRef?.blur();
						}}
					/>
					<div class="ctxmenu-separator" />
				</Show>

				<For
					each={
						lower() && props.searchable
							? props.menu.filter((e) => {
									if (e.type === "separator") return false;
									return e.label.toLowerCase().includes(lower());
							  })
							: props.menu
					}
				>
					{(item, i): sJSX.Element => {
						const id = createMemo(() => `${props.id}-${i()}`);

						return (
							<Switch>
								<Match when={item.type === "separator"}>
									<div class="ctxmenu-separator" />
								</Match>
								<Match when={item.type === "text" && item} keyed>
									{(item): sJSX.Element => (
										<div
											id={id()}
											classList={{
												"ctxmenu-item": true,
												[`color-${item.color ?? Colors.PRIMARY}`]: true,
												disabled: item.disabled,
												selected: props.selectedItem[0]() === id(),
											}}
											onClick={(e): void => {
												e.stopPropagation();
												e.preventDefault();
												if (item.disabled) return;
												item.action();
												props.hide();
											}}
											onMouseEnter={(): void => {
												if (item.disabled) return;
												props.selectedItem[1](id());
											}}
										>
											<span class="ctx-label">{item.label}</span>
										</div>
									)}
								</Match>
								<Match when={item.type === "icon" && item} keyed>
									{(item): sJSX.Element => (
										<div
											id={id()}
											classList={{
												"ctxmenu-item": true,
												[`color-${("color" in item && item.color) || Colors.PRIMARY}`]: true,
												disabled: item.disabled,
												selected: props.selectedItem[0]() === id(),
											}}
											onClick={(e): void => {
												e.stopPropagation();
												e.preventDefault();
												if (item.disabled) return;
												item.action();
												props.hide();
											}}
											onMouseEnter={(): void => {
												if (item.disabled) return;
												props.selectedItem[1](id());
											}}
										>
											<span class="ctx-label">{item.label}</span>
											<div class="ctx-icon">
												{item.icon({
													size: 18,
												})}
											</div>
										</div>
									)}
								</Match>
								<Match when={item.type === "switch" && item} keyed>
									{(item): sJSX.Element => (
										<div
											id={id()}
											classList={{
												"ctxmenu-item": true,
												[`color-${item.color ?? Colors.PRIMARY}`]: true,
												selected: props.selectedItem[0]() === id(),
											}}
											onClick={(e): void => {
												e.stopPropagation();
												e.preventDefault();
												item.action();
											}}
											onMouseEnter={(): void => props.selectedItem[1](id())}
										>
											<span class="ctx-label">{item.label}</span>
											<input class="ctx-checkbox" type="checkbox" checked={item.enabled()} />
										</div>
									)}
								</Match>
								<Match when={item.type === "submenu" && item} keyed>
									{(item): sJSX.Element => {
										const isSelected = createMemo(() => props.selectedItem[0]().startsWith(id()));
										let smRef: HTMLDivElement | undefined;

										return (
											<div
												id={id()}
												classList={{
													"ctxmenu-item": true,
													[`color-${item.color ?? Colors.PRIMARY}`]: true,
													selected: props.selectedItem[0]().startsWith(id()),
												}}
												ref={smRef}
												onMouseEnter={(): void => props.selectedItem[1](id())}
												onClick={(e): void => {
													e.stopPropagation();
													e.preventDefault();
													item.action();
													props.hide();
												}}
											>
												<span class="ctx-label">{item.label}</span>
												<div class="ctx-icon">
													<FaSolidChevronRight size={12} />
												</div>
												<Show when={isSelected()}>
													<Menu
														hide={props.hide}
														ref={(): void => {}}
														selectedItem={props.selectedItem}
														id={id()}
														menu={item.submenu}
														searchable={item.searchable}
														parentRect={smRef!.getBoundingClientRect() as DOMRect}
														onmouseenter={(): void => props.selectedItem[1](id())}
														onmouseleave={(): void => props.selectedItem[1](id())}
														isSubmenu
													/>
												</Show>
											</div>
										);
									}}
								</Match>
							</Switch>
						);
					}}
				</For>
			</div>
		</div>
	);
}

export function ContextmenuDirective(element: Element, value: Accessor<contextmenuProps>): void {
	let layerId: number | undefined;
	let menu: HTMLDivElement | undefined;
	const [selectedItem, setSelectedItem] = createSignal("");

	function hide(): void {
		if (layerId !== undefined) layerId = void removeLayer(layerId);
		document.removeEventListener("mousedown", clickOutsideHandler as (e: Event) => void);
		document.removeEventListener("contextmenu", clickOutsideHandler as (e: Event) => void);
		document.removeEventListener("keydown", kbNavHandler as (e: Event) => void);
	}

	function contextmenuHandler(e: MouseEvent): void {
		e.preventDefault();
		e.stopImmediatePropagation();

		document.addEventListener("mousedown", clickOutsideHandler as (e: Event) => void);
		document.addEventListener("contextmenu", clickOutsideHandler as (e: Event) => void);
		document.addEventListener("keydown", kbNavHandler as (e: Event) => void);

		setSelectedItem("");
		layerId = addLayer(() => (
			<Menu
				hide={hide}
				selectedItem={[selectedItem, setSelectedItem]}
				id="contextmenuid"
				ref={(e): void => {
					menu = e;
				}}
				menu={value().menu}
				searchable={value().searchable}
				parentRect={
					{
						height: 1,
						width: 1,
						x: e.clientX,
						y: e.clientY,
					} as DOMRect
				}
				onmouseenter={(): void => void setSelectedItem("contextmenuid")}
				onmouseleave={(): void => void setSelectedItem("")}
			/>
		));
	}

	function clickOutsideHandler(e: MouseEvent): void {
		if (layerId === undefined || !menu) return;
		if (menu === e.target) return e.stopPropagation(), e.preventDefault();
		if (!menu.contains(e.target as Node)) hide();
	}

	function kbNavHandler(e: KeyboardEvent): void {
		// @ts-expect-error nodeName does exist
		if (e.target?.nodeName === "INPUT") {
			if (e.key === " " || e.key === "Enter") {
				return;
			}
		} else {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
		if (e.key === "Escape") return hide();

		if (e.key === " " || e.key === "Enter") {
			return document.getElementById(selectedItem())?.click();
		}

		switch (e.key) {
			case "ArrowUp":
				navPrev();
				break;
			case "ArrowDown":
				navNext();
				break;
			case "ArrowLeft":
				navUp();
				break;
			case "ArrowRight":
				navDown();
		}
	}

	// TOOD: kb nav?

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	function navNext(): void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	function navPrev(): void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	function navUp(): void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	function navDown(): void {}

	createRenderEffect(() => {
		element.addEventListener(value().showOn ?? "contextmenu", contextmenuHandler as (e: Event) => void);

		onCleanup(() => {
			element.removeEventListener(value().showOn ?? "contextmenu", contextmenuHandler as (e: Event) => void);

			document.removeEventListener("mousedown", clickOutsideHandler as (e: Event) => void);
			document.removeEventListener("contextmenu", clickOutsideHandler as (e: Event) => void);
			document.removeEventListener("keydown", kbNavHandler as (e: Event) => void);
		});
	});
}
