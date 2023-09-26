import { NavLink, useParams } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import ChannelStore from "@stores/channels";

import { FaSolidChevronDown, FaSolidHashtag, FaSolidImage, FaSolidLock, FaSolidTriangleExclamation } from "solid-icons/fa";
import { HiOutlineChatBubbleLeftRight, HiOutlineSpeakerWave, HiSolidChatBubbleLeft } from "solid-icons/hi";
import { RiBusinessMegaphoneLine, RiMapSignalTowerLine } from "solid-icons/ri";

import { useSelectedChannelContext } from "../common/selectioncontext";

import { ChannelTypes } from "@renderer/constants/channel";
import Storage from "@renderer/modules/storage";

function ModifiedIcon<T extends (props: { size: string }) => JSX.Element>(props: {
	hasThreads: boolean;
	icon: T;
	isLimited: boolean;
	isNSFW: boolean;
}): JSX.Element {
	const clipPath = createMemo(() => {
		if (props.hasThreads && (props.isLimited || props.isNSFW)) return "polygon(55% 0, 55% 50%, 45% 50%, 45% 100%, 0 100%, 0 0)";
		if (props.isLimited || props.isNSFW) return "polygon(55% 0, 55% 45%, 100% 45%, 100% 100%, 0 100%, 0 0)";
		if (props.hasThreads) return "polygon(100% 50%, 45% 50%, 45% 100%, 0 100%, 0 0)";
		return "polygon(0 0, 0 100%, 100% 100%, 100% 0)";
	});

	return (
		<svg class="channel-icon" width="20px" height="20px">
			<foreignObject
				width="16px"
				height="16px"
				x="2px"
				y="2px"
				style={{
					"clip-path": clipPath(),
				}}
			>
				{
					/* @once */ props.icon({
						size: "16px",
					})
				}
			</foreignObject>
			<Show when={props.isLimited || props.isNSFW}>
				<Show when={props.isNSFW} fallback={<FaSolidLock x="11px" y="0.5px" size="8px" />}>
					<FaSolidTriangleExclamation x="11.5px" y="0.5px" size="8px" />
				</Show>
			</Show>
			<Show when={props.hasThreads}>
				<HiSolidChatBubbleLeft x="10px" y="9px" size="10px" />
			</Show>
		</svg>
	);
}

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();

	const hasThreads = createMemo(() => ChannelStore.hasThreads(props.id));

	return (
		<Show when={(!props.isCollapsed() || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<NavLink
					href={`/channels/${params.guildId}/${props.id}`}
					classList={{
						channel: true,
						[`channel-type-${channel.type}`]: true,
						[`channel-${props.id}`]: true,
						selected: selc(props.id),
					}}
				>
					<div class="channel-icon">
						<ModifiedIcon
							hasThreads={channel.type !== ChannelTypes.GUILD_FORUM && hasThreads()}
							isNSFW={"nsfw" in channel && !!channel.nsfw}
							isLimited={false}
							icon={untrack(() => {
								switch (channel.type) {
									case ChannelTypes.GUILD_TEXT:
										return FaSolidHashtag;
									case ChannelTypes.GUILD_ANNOUNCEMENT:
										return RiBusinessMegaphoneLine;
									case ChannelTypes.GUILD_FORUM:
										return HiOutlineChatBubbleLeftRight;
									case ChannelTypes.GUILD_MEDIA:
										return FaSolidImage;

									default:
										throw "Tried to render channel icon for unknown channel type.";
								}
							})}
						/>
					</div>
					<span class="channel-name">{channel.name}</span>
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
						[`channel-${props.id}`]: true,
						selected: selc(props.id),
					}}
				>
					<div class="channel-icon">
						<ModifiedIcon
							hasThreads={false}
							isNSFW={false}
							isLimited={true}
							icon={/* @once */ channel.type === ChannelTypes.GUILD_VOICE ? HiOutlineSpeakerWave : RiMapSignalTowerLine}
						/>
					</div>
					<span class="channel-name">{channel.name}</span>
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
					<div
						classList={{
							category: true,
							channel: true,
							[`channel-type-${ChannelTypes.GUILD_CATEGORY}`]: true,
							[`channel-${props.id}`]: true,
							collapsed: isCollapsed(),
						}}
						onClick={toggleCollapsed}
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

export default function GuildChannels(): JSX.Element {
	const params = useParams();
	const channels = createMemo(() => ChannelStore.getSortedGuildChannels(params.guildId));

	return (
		<Show when={channels()}>
			<div class="channels guild-channels scroller scroller-thin">
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
