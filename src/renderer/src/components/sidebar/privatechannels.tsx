import { For, JSX, Show, createMemo } from "solid-js";
import { NavLink } from "@solidjs/router";
import { ChannelTypes } from "@renderer/constants/channel";
import ChannelStore from "@stores/channels";

function PrivateChannel(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const channelName = createMemo(() => ChannelStore.getPrivateChannelName(props.id));
	return (
		<NavLink class={`private-channel channel-type-${channel()?.type}`} href={`/channels/@me/${props.id}`}>
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
		<div class="private-channels">
			<div class="friends-button"></div>
			<div class="private-channels-header">Direct Messages</div>
			<For each={ChannelStore.getOrderedDirectMessages()}>{(channel): JSX.Element => <PrivateChannel id={channel[0]} />}</For>
		</div>
	);
}
