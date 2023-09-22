import { createContext, createMemo, createSignal, JSX, useContext, ValidComponent } from "solid-js";
import { Dynamic, DynamicProps } from "solid-js/web";

import WindowStore from "@stores/window";

export const AnimationContext = createContext(() => false as boolean);
export const useAnimationContext = (): (() => boolean) => useContext(AnimationContext);

export function HoverAnimationProvider<T extends ValidComponent>(
	props: DistributiveOmit<DynamicProps<T>, "onmouseenter" | "onmouseleave">,
): JSX.Element {
	// @ts-expect-error this is valid.
	// eslint-disable-next-line solid/reactivity
	props.component ??= "div";
	const [isHover, setIsHover] = createSignal(false),
		memo = createMemo(() => isHover() && WindowStore.isFocused());

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

export function FocusAnimationProvider<T extends ValidComponent>(props: DynamicProps<T>): JSX.Element {
	// @ts-expect-error this is valid.
	// eslint-disable-next-line solid/reactivity
	props.component ??= "div";
	return (
		<AnimationContext.Provider value={WindowStore.isFocused}>
			<Dynamic {...props} />
		</AnimationContext.Provider>
	);
}
