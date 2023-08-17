import { For, JSX, Show, createMemo } from "solid-js";
import { NavLink } from "@solidjs/router";
import { ChannelTypes } from "@renderer/constants/channel";
import ChannelStore from "@stores/channels";
import { useSelectedChannelContext } from "../common/selectioncontextprovider";

function PrivateChannel(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const channelName = createMemo(() => ChannelStore.getPrivateChannelName(props.id));
	const selc = useSelectedChannelContext();

	return (
		<NavLink
			href={`/channels/@me/${props.id}`}
			classList={{
				channel: true,
				[`channel-type-${channel().type}`]: true,
				selected: selc(props.id),
			}}
		>
			<div class="channel-icon"></div>
			<div class="channel-text">
				<span class="channel-name">{channelName()}</span>
				<Show when={channel()?.type === ChannelTypes.DM}>
					<span class="channel-status">status text maybe</span>
				</Show>
			</div>
		</NavLink>
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
