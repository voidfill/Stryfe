import { createEffect, createMemo, createSignal, JSX, onCleanup, onMount, Show } from "solid-js";

import { BsCardText } from "solid-icons/bs";

import { useAnimationContext } from "./animationcontext";
import TooltipDirective from "./tooltip";

import "./customstatus.scss";

import { ActivityTypes } from "@renderer/constants/user";
import ActivityStore from "@renderer/stores/activities";

TooltipDirective;

function emojiUrl(id: string, size = 44, animated = false): string {
	return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=${size}&quality=lossless`;
}

function Emoji(props: { emoji: { animated?: boolean; id?: string; name: string }; size: number; tooltip: boolean }): JSX.Element {
	const doAnimate = useAnimationContext();

	// TODO: Size table
	return (
		<Show when={props.emoji.id} fallback={<span>{props.emoji.name}</span>}>
			<img
				use:TooltipDirective={{ content: () => props.emoji.name, suppress: !props.tooltip }}
				width={props.size}
				height={props.size}
				src={emojiUrl(props.emoji.id!, 44, props.emoji.animated && doAnimate())}
				alt=""
			/>
		</Show>
	);
}

export default function CustomStatus(props: { inline?: boolean; userId: string }): JSX.Element {
	let textRef: HTMLSpanElement | undefined, observer: ResizeObserver | undefined;
	const status = createMemo(() => ActivityStore.getCustomStatus(props.userId));
	const isPlaying = createMemo(() => ActivityStore.getActivities(props.userId)?.some((a) => a.type !== ActivityTypes.CUSTOM));

	return (
		<Show when={status()} keyed>
			{(status): JSX.Element => {
				const [isOverflowing, setOverflowing] = createSignal(false);
				onMount(() => {
					observer = new ResizeObserver(() => {
						setOverflowing(textRef!.scrollWidth > textRef!.clientWidth);
					});
					observer.observe(textRef!);
				});
				onCleanup(() => observer?.disconnect());

				return (
					<div class="custom-status">
						<Show when={status.emoji} keyed>
							{(emoji): JSX.Element => <Emoji emoji={emoji} size={14} tooltip={!props.inline} />}
						</Show>
						<span
							ref={textRef}
							use:TooltipDirective={{ content: () => status.text, suppress: !isOverflowing() }}
							class="custom-status-text"
						>
							{status.text}
						</span>
						<Show when={isPlaying()}>
							<BsCardText class="activity-box" size={14} />
						</Show>
					</div>
				);
			}}
		</Show>
	);
}
