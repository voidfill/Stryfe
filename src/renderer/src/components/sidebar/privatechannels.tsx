import { A, useParams, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, For, JSX, onMount, Show } from "solid-js";

import { ChannelTypes } from "@constants/channel";

import ChannelStore from "@stores/channels";

import { FiUsers } from "solid-icons/fi";

import { HoverAnimationDirective } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";
import CustomStatus from "../common/customstatus";
import { useLocationContext } from "../common/locationcontext";
import OverflowTooltip from "../common/overflowtooltip";

HoverAnimationDirective;
OverflowTooltip;

function PrivateChannel(props: { id: string }): JSX.Element {
	let ref: HTMLAnchorElement;
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const channelName = createMemo(() => ChannelStore.getPrivateChannelName(props.id));
	const location = useLocationContext();
	const [searchParams, setSearchParams] = useSearchParams();

	createEffect(() => {
		if (location().selectedChannel(props.id) && searchParams.jump) {
			setSearchParams({ jump: undefined });
			ref?.scrollIntoView({ behavior: "instant", block: "nearest" });
		}
	});

	return (
		// @ts-expect-error ref
		<A ref={ref} href={`/channels/@me/${props.id}`}>
			<div
				classList={{
					channel: true,
					[`channel-type-${channel().type}`]: true,
					[`channel-${props.id}`]: true,
					selected: location().selectedChannel(props.id),
				}}
				use:HoverAnimationDirective
			>
				<div class="channel-icon">
					<Show when={channel().type === ChannelTypes.DM} fallback={<Avatar size={32} groupDMId={props.id} />}>
						<Avatar size={32} userId={channel().recipient_ids[0]} showStatus={ShowStatus.ALWAYS} channelId={props.id} />
					</Show>
				</div>
				<div class="channel-text">
					<span class="channel-name" use:OverflowTooltip={() => channelName()}>
						{channelName()}
					</span>
					<Show when={channel().type === ChannelTypes.DM}>
						<CustomStatus userId={channel().recipient_ids[0]} inline />
					</Show>
				</div>
			</div>
		</A>
	);
}

let lastKnownScrollPosition = 0;

export default function PrivateChannels(): JSX.Element {
	const params = useParams();
	let ref: HTMLDivElement;

	onMount(() => {
		ref?.scrollTo({ behavior: "instant", top: lastKnownScrollPosition });
	});

	return (
		<div
			class="channels private-channels scroller scroller-thin scroller-hover-thumb"
			ref={
				// @ts-expect-error ref
				ref
			}
			onScroll={(): void => {
				lastKnownScrollPosition = ref.scrollTop;
			}}
		>
			<A
				href="/channels/@me"
				classList={{
					channel: true,
					"friends-button": true,
					selected: !params.channelId,
				}}
			>
				<FiUsers size={24} />
				<span>Friends</span>
			</A>
			<div class="private-channels-header">Direct Messages</div>
			<For each={ChannelStore.getOrderedDirectMessages()}>{(channel): JSX.Element => <PrivateChannel id={channel[0]} />}</For>
		</div>
	);
}
