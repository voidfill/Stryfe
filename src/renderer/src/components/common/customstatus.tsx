import { createMemo, createSignal, JSX, onCleanup, onMount, Show } from "solid-js";

import { ActivityTypes } from "@constants/user";

import ActivityStore from "@stores/activities";

import { BsCardText } from "solid-icons/bs";

import Emoji from "./emoji";
import tippy from "./tooltip";

import "./customstatus.scss";

tippy;

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
