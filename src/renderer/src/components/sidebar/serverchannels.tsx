import { Accessor, For, JSX, Show, createEffect, createMemo } from "solid-js";

import ChannelStore from "@stores/channels";
import { NavLink, useParams } from "@solidjs/router";
import { createStore } from "solid-js/store";
import Storage from "@renderer/modules/storage";
import { useSelectedChannelContext } from "../common/selectioncontextprovider";

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();

	return (
		<Show when={(!props.isCollapsed() || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<NavLink
					href={`/channels/${params.guildId}/${props.id}`}
					classList={{
						channel: true,
						[`channel-type-${channel.type}`]: true,
						selected: selc(props.id),
					}}
				>
					{channel.type}
					{channel.name}
				</NavLink>
			)}
		</Show>
	);
}

function VoiceChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();

	return (
		<Show when={(!props.isCollapsed() || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<NavLink
					href={`/channels/${params.guildId}/${props.id}`}
					classList={{
						channel: true,
						[`channel-type-${channel.type}`]: true,
						selected: selc(props.id),
					}}
				>
					{channel.type}
					{channel.name}
				</NavLink>
			)}
		</Show>
	);
}

const [collapsed, setCollapsed] = createStore<{ [key: string]: boolean }>(Storage.get<{ [key: string]: boolean }>("collapsedChannels", {}));
createEffect(() => {
	Storage.set("collapsedChannels", collapsed);
});

function Category(props: { id: string; other: string[]; voice: string[] }): JSX.Element {
	const category = createMemo(() => ChannelStore.getGuildChannel(props.id));
	const isCollapsed = createMemo(() => collapsed[props.id] ?? false);
	const toggleCollapsed = (): void => setCollapsed(props.id, !isCollapsed());

	return (
		<Show when={category()} keyed>
			{(category): JSX.Element => (
				<>
					<div onClick={toggleCollapsed}>category {category.name}</div>
					<For each={props.other}>{(id): JSX.Element => <TextChannel id={id} isCollapsed={isCollapsed} />}</For>
					<For each={props.voice}>{(id): JSX.Element => <VoiceChannel id={id} isCollapsed={isCollapsed} />}</For>
				</>
			)}
		</Show>
	);
}

export default function ServerChannels(): JSX.Element {
	const params = useParams();
	const channels = createMemo(() => ChannelStore.getSortedGuildChannels(params.guildId));

	return (
		<Show when={channels()}>
			<div class="channels server-channels scroller scroller-thin">
				<For each={channels()?.uncategorized.other}>{(id): JSX.Element => <TextChannel id={id} isCollapsed={(): boolean => false} />}</For>
				<For each={channels()?.uncategorized.voice}>{(id): JSX.Element => <VoiceChannel id={id} isCollapsed={(): boolean => false} />}</For>
				<For each={channels()?.categorized}>
					{(category): JSX.Element => <Category id={category?.id} other={category?.other} voice={category?.voice} />}
				</For>
			</div>
		</Show>
	);
}
