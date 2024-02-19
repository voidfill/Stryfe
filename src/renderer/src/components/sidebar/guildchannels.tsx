import { useParams } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, onCleanup, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import { ChannelTypes } from "@constants/channel";

import Storage from "@modules/storage";

import ChannelStore from "@stores/channels";
import GuildStore from "@stores/guilds";

import { useSelectedChannelContext } from "@components/common/selectioncontext";
import { FaSolidChevronDown } from "solid-icons/fa";

import ChannelIcon from "../common/channelicon";

const refMap = new Map<string, any>();

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildTextChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={(!props.isCollapsed() || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<a
					href={`/channels/${params.guildId}/${props.id}`}
					classList={{
						channel: true,
						[`channel-type-${channel.type}`]: true,
						[`channel-${props.id}`]: true,
						selected: selc(props.id),
					}}
					ref={(el): void => {
						refMap.set(props.id, el);
					}}
				>
					<div class="channel-icon">
						<ChannelIcon id={props.id} size={20} />
					</div>
					<span class="channel-name">{channel.name}</span>
				</a>
			)}
		</Show>
	);
}

function VoiceChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildVoiceChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={(!props.isCollapsed() || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<a
					href={`/channels/${params.guildId}/${props.id}`}
					classList={{
						channel: true,
						[`channel-type-${channel.type}`]: true,
						[`channel-${props.id}`]: true,
						selected: selc(props.id),
					}}
					ref={(el): void => {
						refMap.set(props.id, el);
					}}
				>
					<div class="channel-icon">
						<ChannelIcon id={props.id} size={20} />
					</div>
					<span class="channel-name">{channel.name}</span>
				</a>
			)}
		</Show>
	);
}

const [collapsed, setCollapsed] = createStore<{ [key: string]: boolean }>(Storage.get<{ [key: string]: boolean }>("collapsedChannels", {}));
createEffect(() => {
	Storage.set("collapsedChannels", collapsed);
});

function Category(props: { id: string; other: string[]; voice: string[] }): JSX.Element {
	const category = createMemo(() => ChannelStore.getGuildCategoryChannel(props.id));
	const isCollapsed = createMemo(() => collapsed[props.id] ?? false);
	const toggleCollapsed = (): void => setCollapsed(props.id, !isCollapsed());

	onCleanup(() => {
		refMap.delete(props.id); // not sure yet if we need to have categories in the refmap but we'll see
	});

	return (
		<Show when={category()} keyed>
			{(category): JSX.Element => (
				<>
					<div
						classList={{
							category: true,
							channel: true,
							[`channel-type-${ChannelTypes.GUILD_CATEGORY}`]: true,
							[`channel-${props.id}`]: true,
							collapsed: isCollapsed(),
						}}
						onClick={toggleCollapsed}
						ref={(el): void => {
							refMap.set(props.id, el);
						}}
					>
						<div class="channel-icon">
							<FaSolidChevronDown size={12} />
						</div>
						<span class="channel-name">{category.name}</span>
					</div>
					<For each={props.other}>{(id): JSX.Element => <TextChannel id={/*@once*/ id} isCollapsed={isCollapsed} />}</For>
					<For each={props.voice}>{(id): JSX.Element => <VoiceChannel id={/*@once*/ id} isCollapsed={isCollapsed} />}</For>
				</>
			)}
		</Show>
	);
}

const scrollPositions = new Map<string, number>();

export default function GuildChannels(): JSX.Element {
	const params = useParams();
	const channels = createMemo(() => ChannelStore.getSortedGuildChannels(params.guildId));
	const guildName = createMemo(() => GuildStore.getGuild(params.guildId)?.name);
	let ref: HTMLDivElement;

	createEffect(() => {
		const pos = scrollPositions.get(params.guildId);
		if (!ref) return;
		if (pos || pos === 0) return void ref.scrollTo({ behavior: "instant", top: pos });
		refMap.get(untrack(() => params.channelId))?.scrollIntoView({ behavior: "instant", block: "center" });
	});

	let lastKnownScrollPosition = 0;
	let ticking = false;

	return (
		<Show when={channels()}>
			<button class="guild-header">
				<div class="boost-icon" />
				<span class="guild-name">{guildName()}</span>
				<FaSolidChevronDown class="header-context-menu-icon" size={16} />
			</button>
			<div
				class="channels guild-channels scroller scroller-thin scroller-hover-thumb"
				ref={
					// @ts-expect-error nuh uh
					ref
				}
				onScroll={(): void => {
					lastKnownScrollPosition = ref.scrollTop;
					if (!ticking) {
						window.requestAnimationFrame(() => {
							scrollPositions.set(params.guildId, lastKnownScrollPosition);
							ticking = false;
						});
						ticking = true;
					}
				}}
			>
				<For each={channels()?.uncategorized.other}>
					{(id): JSX.Element => <TextChannel id={/*@once*/ id} isCollapsed={(): boolean => false} />}
				</For>
				<For each={channels()?.uncategorized.voice}>
					{(id): JSX.Element => <VoiceChannel id={/*@once*/ id} isCollapsed={(): boolean => false} />}
				</For>
				<For each={channels()?.categorized}>
					{(category): JSX.Element => <Category id={/*@once*/ category?.id} other={category?.other} voice={category?.voice} />}
				</For>
			</div>
		</Show>
	);
}
