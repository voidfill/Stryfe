import { createMemo, JSX } from "solid-js";

import ChannelStore from "@stores/channels";

import { useLocationContext } from "@components/common/locationcontext";

export default function TextArea(): JSX.Element {
	const location = useLocationContext();
	const channelName = createMemo(() =>
		location().guildId === "@me"
			? "@" + ChannelStore.getPrivateChannelName(location().channelId)
			: "#" + ChannelStore.getGuildChannel(location().channelId)?.name,
	);

	return (
		<div class="text-area">
			<textarea placeholder={`Message ${channelName() ?? "#unknown-channel"}`} style={{ all: "unset" }} />
		</div>
	);
}
