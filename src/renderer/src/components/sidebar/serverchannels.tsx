import { For, JSX, Show, createMemo } from "solid-js";

import ChannelStore from "@stores/channels";
import { useParams } from "@solidjs/router";

export default function ServerChannels(): JSX.Element {
	const params = useParams();
	const channels = createMemo(() => ChannelStore.getSortedGuildChannels(params.guildId));

	return (
		<Show when={channels()}>
			<For each={channels()?.uncategorized.other}>
				{(channel): JSX.Element => <div>text {ChannelStore.getGuildChannel(channel)?.name}</div>}
			</For>
			<For each={channels()?.uncategorized.voice}>
				{(channel): JSX.Element => <div>voice {ChannelStore.getGuildChannel(channel)?.name}</div>}
			</For>
			<For each={channels()?.categorized}>
				{(category): JSX.Element => (
					<>
						<div>category {ChannelStore.getGuildChannel(category.id)?.name}</div>
						<For each={category.other}>{(channel): JSX.Element => <div>text {ChannelStore.getGuildChannel(channel)?.name}</div>}</For>
						<For each={category.voice}>{(channel): JSX.Element => <div>voice {ChannelStore.getGuildChannel(channel)?.name}</div>}</For>
					</>
				)}
			</For>
		</Show>
	);
}
