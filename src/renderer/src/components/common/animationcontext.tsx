import { createContext, createMemo, createRenderEffect, createSignal, getOwner, JSX as _JSX, onCleanup, useContext, ValidComponent } from "solid-js";
import { Dynamic, DynamicProps } from "solid-js/web";

import { isFocused } from "@stores/window";

export const AnimationContext = createContext(() => false as boolean);
export const useAnimationContext = (): (() => boolean) => useContext(AnimationContext);

// Sadly need these since directives dont support custom components.
export function HoverAnimationProvider<T extends ValidComponent>(
	props: DistributiveOmit<DynamicProps<T>, "onmouseenter" | "onmouseleave">,
): _JSX.Element {
	// @ts-expect-error this is valid.
	// eslint-disable-next-line solid/reactivity
	props.component ??= "div";
	const [isHover, setIsHover] = createSignal(false),
		memo = createMemo(() => isHover() && isFocused());

	return (
		<AnimationContext.Provider value={memo}>
			<Dynamic
				{...(props as DynamicProps<T>)}
				onmouseenter={(): void => void setIsHover(true)}
				onmouseleave={(): void => void setIsHover(false)}
			/>
		</AnimationContext.Provider>
	);
}
export function FocusAnimationProvider<T extends ValidComponent>(props: DynamicProps<T>): _JSX.Element {
	// @ts-expect-error this is valid.
	// eslint-disable-next-line solid/reactivity
	props.component ??= "div";
	return (
		<AnimationContext.Provider value={isFocused}>
			<Dynamic {...props} />
		</AnimationContext.Provider>
	);
}

export function FocusAnimationDirective(): void {
	const owner = getOwner();

	createRenderEffect(() => {
		owner!.context = { ...owner!.context, [AnimationContext.id]: isFocused };
	});
}

export function HoverAnimationDirective(el: Element): void {
	const [isHover, setIsHover] = createSignal(false),
		memo = createMemo(() => isHover() && isFocused()),
		owner = getOwner();

	createRenderEffect(() => {
		owner!.context = { ...owner!.context, [AnimationContext.id]: memo };
	});

	const mouseenter = (): void => void setIsHover(true),
		mouseleave = (): void => void setIsHover(false);

	el.addEventListener("mouseenter", mouseenter);
	el.addEventListener("mouseleave", mouseleave);

	onCleanup(() => {
		el.removeEventListener("mouseenter", mouseenter);
		el.removeEventListener("mouseleave", mouseleave);
	});
}

export function NoAnimationDirective(): void {
	const owner = getOwner();

	createRenderEffect(() => {
		owner!.context = { ...owner!.context, [AnimationContext.id]: (): boolean => false };
	});
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			FocusAnimationDirective: any;
			HoverAnimationDirective: any;
			NoAnimationDirective: any;
		}
	}
}
