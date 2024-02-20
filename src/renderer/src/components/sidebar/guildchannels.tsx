import { useParams } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, onCleanup, Show, untrack } from "solid-js";

import { ChannelTypes } from "@constants/channel";

import ChannelStore from "@stores/channels";
import GuildStore from "@stores/guilds";
import SettingsStore, { ChannelNotificationLevel, notificationLevelToText } from "@stores/settings";

import { useSelectedChannelContext } from "@components/common/selectioncontext";
import { FaSolidChevronDown } from "solid-icons/fa";

import ChannelIcon from "../common/channelicon";
import { ContextmenuDirective, Id, Optional, Separator } from "../common/contextmenu";

ContextmenuDirective;

const refMap = new Map<string, any>();

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean>; parentId?: string }): JSX.Element {
	const params = useParams();
	const selc = useSelectedChannelContext();
	const channel = createMemo(() => ChannelStore.getGuildTextChannel(props.id));
	const mutedHide = createMemo(
		() => (SettingsStore.userGuildSettings[params.guildId]?.hide_muted_channels && SettingsStore.channelOverrides[props.id]?.muted) ?? false,
	);
	const notificationLevel = createMemo(() => SettingsStore.getChannelNotificationLevel(props.id));

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={(!(props.isCollapsed() || mutedHide()) || selc(props.id)) && channel()} keyed>
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
					use:ContextmenuDirective={{
						menu: [
							{
								action: (): void => void 0,
								disabled: true,
								label: "Mark As Read",
							},
							Separator,
							{
								action: () => void 0,
								label: "Invite People",
							},
							{
								action: () => void navigator.clipboard.writeText(`https://discord.com/channels/${params.guildId}/${props.id}`),
								label: "Copy Link",
							},
							Separator,
							SettingsStore.channelOverrides[props.id]?.muted
								? {
										action: () => SettingsStore.unmuteChannel(props.id),
										label: "Unmute Channel",
										subText: "Muted Until" + SettingsStore.channelOverrides[props.id]?.mute_config?.end_time, // TODO: format time
								  }
								: {
										action: () => SettingsStore.muteChannel(props.id),
										label: "Mute Channel",
										submenu: [
											{
												action: () => SettingsStore.muteChannel(props.id, 15 * 60),
												label: "For 15 Minutes",
											},
											{
												action: () => SettingsStore.muteChannel(props.id, 60 * 60),
												label: "For 1 Hour",
											},
											{
												action: () => SettingsStore.muteChannel(props.id, 3 * 60 * 60),
												label: "For 3 Hours",
											},
											{
												action: () => SettingsStore.muteChannel(props.id, 6 * 60 * 60),
												label: "For 6 Hours",
											},
											{
												action: () => SettingsStore.muteChannel(props.id, 24 * 60 * 60),
												label: "For 24 Hours",
											},
											{
												action: () => SettingsStore.muteChannel(props.id),
												label: "Until I Turn It Back On",
											},
										],
										type: "submenu",
								  },
							{
								action: () => void 0,
								label: "Notification Settings",
								subText: notificationLevelToText(SettingsStore.getChannelNotificationLevel(props.id)),
								submenu: [
									...Optional(props.parentId, {
										action: () => SettingsStore.setChannelNotificationLevel(props.id, ChannelNotificationLevel.PARENT_DEFAULT),
										enabled: () => notificationLevel() === ChannelNotificationLevel.PARENT_DEFAULT,
										label: notificationLevelToText(ChannelNotificationLevel.PARENT_DEFAULT),
										subText: notificationLevelToText(
											SettingsStore.resolveChannelNotificationLevel(props.parentId!, params.guildId),
										),
										type: "switch",
									}),
									{
										action: () => SettingsStore.setChannelNotificationLevel(props.id, ChannelNotificationLevel.ALL_MESSAGES),
										enabled: () => notificationLevel() === ChannelNotificationLevel.ALL_MESSAGES,
										label: notificationLevelToText(ChannelNotificationLevel.ALL_MESSAGES),
										type: "switch",
									},
									{
										action: () => SettingsStore.setChannelNotificationLevel(props.id, ChannelNotificationLevel.ONLY_MENTIONS),
										enabled: () => notificationLevel() === ChannelNotificationLevel.ONLY_MENTIONS,
										label: notificationLevelToText(ChannelNotificationLevel.ONLY_MENTIONS),
										type: "switch",
									},
									{
										action: () => SettingsStore.setChannelNotificationLevel(props.id, ChannelNotificationLevel.NOTHING),
										enabled: () => notificationLevel() === ChannelNotificationLevel.NOTHING,
										label: notificationLevelToText(ChannelNotificationLevel.NOTHING),
										type: "switch",
									},
								],
								type: "submenu",
							},
							...Optional(true, [
								{
									action: () => void 0,
									label: "//TODO: Channel Settings Entries",
								},
								Separator,
							]),
							Id(props.id, "Copy Channel ID"),
						],
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

function Category(props: { id: string; other: string[]; voice: string[] }): JSX.Element {
	const category = createMemo(() => ChannelStore.getGuildCategoryChannel(props.id));
	const isCollapsed = createMemo(() => SettingsStore.channelOverrides[props.id]?.collapsed ?? false);

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
						onClick={(): void => SettingsStore.toggleCollapsed(props.id)}
						ref={(el): void => {
							refMap.set(props.id, el);
						}}
					>
						<div class="channel-icon">
							<FaSolidChevronDown size={12} />
						</div>
						<span class="channel-name">{category.name}</span>
					</div>
					<For each={props.other}>
						{(id): JSX.Element => <TextChannel id={/*@once*/ id} parentId={/*@once*/ props.id} isCollapsed={isCollapsed} />}
					</For>
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
