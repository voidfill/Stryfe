import { For, JSX, Show, createMemo } from "solid-js";
import { NavLink } from "@solidjs/router";
import { ChannelTypes } from "@renderer/constants/channel";
import ChannelStore from "@stores/channels";
import { useSelectedChannelContext } from "../common/selectioncontext";
import { HoverAnimationProvider } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";

function PrivateChannel(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const channelName = createMemo(() => ChannelStore.getPrivateChannelName(props.id));
	const selc = useSelectedChannelContext();

	return (
		<HoverAnimationProvider>
			<NavLink
				href={`/channels/@me/${props.id}`}
				classList={{
					channel: true,
					[`channel-type-${channel().type}`]: true,
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
				</div>
			</NavLink>
		</HoverAnimationProvider>
	);
}

export default function PrivateChannels(): JSX.Element {
	return (
		<div class="channels private-channels scroller scroller-thin">
			<div class="friends-button">Friends</div>
			<div class="private-channels-header">Direct Messages</div>
			<For each={ChannelStore.getOrderedDirectMessages()}>{(channel): JSX.Element => <PrivateChannel id={channel[0]} />}</For>
		</div>
	);
}
