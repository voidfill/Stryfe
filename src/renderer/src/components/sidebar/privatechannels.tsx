import { NavLink, useParams } from "@solidjs/router";
import { createMemo, For, JSX, onMount, Show } from "solid-js";

import ChannelStore from "@stores/channels";

import { HoverAnimationProvider } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";
import CustomStatus from "../common/customstatus";
import { useSelectedChannelContext } from "../common/selectioncontext";

import { ChannelTypes } from "@renderer/constants/channel";

function PrivateChannel(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const channelName = createMemo(() => ChannelStore.getPrivateChannelName(props.id));
	const selc = useSelectedChannelContext();

	return (
		<HoverAnimationProvider
			component={NavLink}
			href={`/channels/@me/${props.id}`}
			classList={{
				channel: true,
				[`channel-type-${channel().type}`]: true,
				[`channel-${props.id}`]: true,
				selected: selc(props.id),
			}}
		>
			<div class="channel-icon">
				<Show when={channel().type === ChannelTypes.DM} fallback={<Avatar size={32} groupDMId={props.id} />}>
					<Avatar size={32} userId={channel().recipient_ids[0]} showStatus={ShowStatus.ALWAYS} channelId={props.id} />
				</Show>
			</div>
			<div class="channel-text">
				<span class="channel-name">{channelName()}</span>
				<Show when={channel().type === ChannelTypes.DM}>
					<CustomStatus userId={channel().recipient_ids[0]} />
				</Show>
			</div>
		</HoverAnimationProvider>
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
				// @ts-expect-error nuh uh
				ref
			}
			onScroll={(): void => {
				lastKnownScrollPosition = ref.scrollTop;
			}}
		>
			<NavLink
				href="/channels/@me"
				classList={{
					"friends-button": true,
					selected: !params.channelId,
				}}
			>
				Friends
			</NavLink>
			<div class="private-channels-header">Direct Messages</div>
			<For each={ChannelStore.getOrderedDirectMessages()}>{(channel): JSX.Element => <PrivateChannel id={channel[0]} />}</For>
		</div>
	);
}
