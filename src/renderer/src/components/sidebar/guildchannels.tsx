import { A, useParams } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, onCleanup, Show, untrack } from "solid-js";

import { ChannelTypes } from "@constants/channel";
import permissions from "@constants/permissions";

import ChannelStore from "@stores/channels";
import GuildStore from "@stores/guilds";
import PermissionsStore from "@stores/permissions";
import RolesStore from "@stores/roles";
import SettingsStore, { NotificationLevel, notificationLevelToText } from "@stores/settings";
import UserStore from "@stores/users";

import { useSelectedChannelContext } from "@components/common/selectioncontext";
import { FaSolidChevronDown } from "solid-icons/fa";

import ChannelIcon from "../common/channelicon";
import { ContextmenuDirective, Id, menuItem, Optional, Separator } from "../common/contextmenu";
import { usePermissionsContext } from "../common/permissionscontext";

RolesStore;
ContextmenuDirective;

const refMap = new Map<string, any>();

function muteContextMenu(id: string, toMuteLabel: string): menuItem {
	return SettingsStore.channelOverrides[id]?.muted
		? {
				action: () => SettingsStore.unmuteChannel(id),
				label: `Unmute ${toMuteLabel}`,
				subText: SettingsStore.channelOverrides[id]?.mute_config?.end_time
					? "Muted Until" + SettingsStore.channelOverrides[id]?.mute_config?.end_time
					: undefined, // TODO: format time
		  }
		: {
				action: () => SettingsStore.muteChannel(id),
				label: `Mute ${toMuteLabel}`,
				submenu: [
					{
						action: () => SettingsStore.muteChannel(id, 15 * 60),
						label: "For 15 Minutes",
					},
					{
						action: () => SettingsStore.muteChannel(id, 60 * 60),
						label: "For 1 Hour",
					},
					{
						action: () => SettingsStore.muteChannel(id, 3 * 60 * 60),
						label: "For 3 Hours",
					},
					{
						action: () => SettingsStore.muteChannel(id, 6 * 60 * 60),
						label: "For 6 Hours",
					},
					{
						action: () => SettingsStore.muteChannel(id, 24 * 60 * 60),
						label: "For 24 Hours",
					},
					{
						action: () => SettingsStore.muteChannel(id),
						label: "Until I Turn It Back On",
					},
				],
				type: "submenu",
		  };
}

function notificationContextMenu(id: string, parentId: string | undefined, guildId: string, notificationLevel: () => NotificationLevel): menuItem {
	return {
		action: () => void 0,
		label: "Notification Settings",
		subText: notificationLevelToText(SettingsStore.getChannelNotificationLevel(id)),
		submenu: [
			{
				action: () => SettingsStore.setChannelNotificationLevel(id, NotificationLevel.PARENT_DEFAULT),
				enabled: () => notificationLevel() === NotificationLevel.PARENT_DEFAULT,
				label: notificationLevelToText(NotificationLevel.PARENT_DEFAULT),
				subText: notificationLevelToText(SettingsStore.resolveChannelNotificationLevel(parentId!, guildId)),
				type: "switch",
			},
			{
				action: () => SettingsStore.setChannelNotificationLevel(id, NotificationLevel.ALL_MESSAGES),
				enabled: () => notificationLevel() === NotificationLevel.ALL_MESSAGES,
				label: notificationLevelToText(NotificationLevel.ALL_MESSAGES),
				type: "switch",
			},
			{
				action: () => SettingsStore.setChannelNotificationLevel(id, NotificationLevel.ONLY_MENTIONS),
				enabled: () => notificationLevel() === NotificationLevel.ONLY_MENTIONS,
				label: notificationLevelToText(NotificationLevel.ONLY_MENTIONS),
				type: "switch",
			},
			{
				action: () => SettingsStore.setChannelNotificationLevel(id, NotificationLevel.NOTHING),
				enabled: () => notificationLevel() === NotificationLevel.NOTHING,
				label: notificationLevelToText(NotificationLevel.NOTHING),
				type: "switch",
			},
		],
		type: "submenu",
	};
}

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean>; parentId?: string }): JSX.Element {
	const params = useParams();
	const selc = useSelectedChannelContext();
	const channel = createMemo(() => ChannelStore.getGuildTextChannel(props.id));
	const mutedHide = createMemo(
		() => (SettingsStore.userGuildSettings[params.guildId]?.hide_muted_channels && SettingsStore.channelOverrides[props.id]?.muted) ?? false,
	);
	const notificationLevel = createMemo(() => SettingsStore.getChannelNotificationLevel(props.id));

	const currentPermissions = usePermissionsContext();
	const canSee = createMemo(() =>
		PermissionsStore.can({
			basePermissions: currentPermissions().guild,
			channelId: props.id,
			guildId: params.guildId,
			memberId: UserStore.getSelfId()!,
			toCheck: permissions.VIEW_CHANNEL,
		}),
	);

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={((!(props.isCollapsed() || mutedHide()) && canSee()) || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<A
					href={`/channels/${params.guildId}/${props.id}`}
					ref={(el): void => {
						refMap.set(props.id, el);
					}}
				>
					<div
						classList={{
							channel: true,
							[`channel-type-${channel.type}`]: true,
							[`channel-${props.id}`]: true,
							selected: selc(props.id),
						}}
						use:ContextmenuDirective={{
							menu: () => [
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
								muteContextMenu(props.id, "Channel"),
								notificationContextMenu(props.id, props.parentId!, params.guildId, notificationLevel),
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
					</div>
				</A>
			)}
		</Show>
	);
}

function VoiceChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildVoiceChannel(props.id));
	const params = useParams();
	const selc = useSelectedChannelContext();
	const mutedHide = createMemo(
		() => (SettingsStore.userGuildSettings[params.guildId]?.hide_muted_channels && SettingsStore.channelOverrides[props.id]?.muted) ?? false,
	);

	const currentPermissions = usePermissionsContext();
	const canSee = createMemo(() =>
		PermissionsStore.can({
			basePermissions: currentPermissions().guild,
			channelId: props.id,
			guildId: params.guildId,
			memberId: UserStore.getSelfId()!,
			toCheck: permissions.VIEW_CHANNEL,
		}),
	);

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={((!(props.isCollapsed() || mutedHide()) && canSee()) || selc(props.id)) && channel()} keyed>
			{(channel): JSX.Element => (
				<A
					href={`/channels/${params.guildId}/${props.id}`}
					ref={(el): void => {
						refMap.set(props.id, el);
					}}
				>
					<div
						classList={{
							channel: true,
							[`channel-type-${channel.type}`]: true,
							[`channel-${props.id}`]: true,
							selected: selc(props.id),
						}}
						use:ContextmenuDirective={{
							menu: () => [
								{
									action: () => void 0,
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
								{
									action: () => void 0,
									enabled: () => false,
									label: "Hide Names",
									type: "switch",
								},
								Separator,
								muteContextMenu(props.id, "Channel"),
								Separator,
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
					</div>
				</A>
			)}
		</Show>
	);
}

function Category(props: { id: string; other: string[]; voice: string[] }): JSX.Element {
	const params = useParams();
	const category = createMemo(() => ChannelStore.getGuildCategoryChannel(props.id));
	const isCollapsed = createMemo(() => SettingsStore.channelOverrides[props.id]?.collapsed ?? false);
	const notificationLevel = createMemo(() => SettingsStore.getChannelNotificationLevel(props.id));
	const currentPermissions = usePermissionsContext();

	const mapFn = (id: string): boolean =>
		PermissionsStore.can({
			basePermissions: currentPermissions().guild,
			channelId: id,
			guildId: params.guildId,
			memberId: UserStore.getSelfId()!,
			toCheck: permissions.VIEW_CHANNEL,
		});
	const canSeeChild = createMemo(() => props.other.some(mapFn) || props.voice.some(mapFn));
	const canSee = createMemo(
		() =>
			(!props.other.length &&
				!props.voice.length &&
				PermissionsStore.can({
					basePermissions: currentPermissions().guild,
					channelId: props.id,
					guildId: params.guildId,
					memberId: UserStore.getSelfId()!,
					toCheck: permissions.MANAGE_CHANNELS,
				})) ||
			canSeeChild(),
	);

	onCleanup(() => {
		refMap.delete(props.id); // not sure yet if we need to have categories in the refmap but we'll see
	});

	return (
		<Show when={canSee() && category()} keyed>
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
						use:ContextmenuDirective={{
							menu: () => [
								{
									action: () => void 0,
									disabled: true,
									label: "Mark As Read",
								},
								Separator,
								{
									action: () => SettingsStore.toggleCollapsed(props.id),
									enabled: () => isCollapsed(),
									label: "Collapse Category",
									type: "switch",
								},
								{
									action: (): void => {
										for (const id of ChannelStore.getGuildChannels(params.guildId) ?? []) {
											SettingsStore.collapse(id);
										}
									},
									label: "Collapse All Categories",
								},
								Separator,
								muteContextMenu(props.id, "Category"),
								notificationContextMenu(props.id, undefined, params.guild_id, notificationLevel),
								Separator,
								...Optional(true, [
									{
										action: () => void 0,
										label: "//TODO: Category Settings Entries",
									},
									Separator,
								]),
								Id(props.id, "Copy Category ID"),
							],
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
				use:ContextmenuDirective={{
					menu: () => [
						{
							action: () => SettingsStore.toggleHideMutedChannels(params.guildId),
							enabled: () => SettingsStore.userGuildSettings[params.guildId]?.hide_muted_channels,
							label: "Hide Muted Channels",
							type: "switch",
						},
						Separator,
						...Optional(true, [
							{
								action: () => void 0,
								label: "//TODO: Channels Settings Entries",
							},
						]),
						{
							action: () => void 0,
							label: "Invite People",
						},
					],
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
