import { createMemo, createSignal, JSX, onCleanup, onMount, Show } from "solid-js";

import { emojiURL } from "@constants/images";
import { ActivityTypes } from "@constants/user";

import ActivityStore from "@stores/activities";

import { BsCardText } from "solid-icons/bs";

import { useAnimationContext } from "./animationcontext";
import tippy from "./tooltip";

import "./customstatus.scss";

tippy;

function Emoji(props: { emoji: { animated?: boolean; id?: string; name: string }; size: number; tooltip: boolean }): JSX.Element {
	const doAnimate = useAnimationContext();

	return (
		<Show when={props.emoji.id} fallback={<span>{props.emoji.name}</span>}>
			<img
				use:tippy={{ content: () => props.emoji.name, disabled: !props.tooltip }}
				width={props.size}
				height={props.size}
				src={emojiURL(props.emoji.id!, 44, props.emoji.animated && doAnimate())}
				alt=""
			/>
		</Show>
	);
}

export default function CustomStatus(props: { inline?: boolean; noToolTip?: boolean; userId: string }): JSX.Element {
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
					<div
						class="custom-status"
						use:tippy={{
							content: () => status.text,
							disabled: props.noToolTip || !isOverflowing(),
							props: {
								animation: "scale-subtle",
								delay: [300, null],
							},
						}}
					>
						<Show when={status.emoji} keyed>
							{(emoji): JSX.Element => <Emoji emoji={emoji} size={14} tooltip={!props.inline} />}
						</Show>
						<span class="custom-status-text" ref={textRef}>
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
