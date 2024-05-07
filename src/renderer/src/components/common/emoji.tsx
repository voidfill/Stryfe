import { JSX, Show } from "solid-js";

import { useAnimationContext } from "./animationcontext";
import tippy from "./tooltip";

import { emojiURL } from "@renderer/constants/images";

tippy;

export default function Emoji(props: { emoji: { animated?: boolean; id?: string; name: string }; size: number; tooltip?: boolean }): JSX.Element {
	const doAnimate = useAnimationContext();

	return (
		<Show when={props.emoji.id} fallback={<span>{props.emoji.name}</span>}>
			<img
				class={`emoji ${props.emoji.animated ? "animated" : ""} emoji-${props.emoji.name} emoji-id-${props.emoji.id}`}
				use:tippy={{ content: () => props.emoji.name, disabled: !props.tooltip }}
				width={props.size}
				height={props.size}
				src={emojiURL(props.emoji.id!, props.size, props.emoji.animated && doAnimate())}
				alt={":" + props.emoji.name + ":"}
			/>
		</Show>
	);
}
