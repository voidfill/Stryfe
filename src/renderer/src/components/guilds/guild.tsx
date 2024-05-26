import { A } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import { HighlightLevel, NotificationLevel } from "@constants/schemata/settings";

import GuildStore from "@stores/guilds";
import SettingsStore, { notificationLevelToText } from "@stores/settings";

import { tippy } from "@components/common/tooltip";

import { HoverAnimationDirective, useAnimationContext } from "../common/animationcontext";
import { Choice, Colors, ContextmenuDirective, Id, Item, Separator, SubMenu, Switch } from "../common/contextmenu";
import { useLocationContext } from "../common/locationcontext";

import { lastSelectedChannels } from "@renderer/signals";
HoverAnimationDirective;
ContextmenuDirective;
tippy;

function ImageOrAcronym(props: { id: string }): JSX.Element {
	const doAnimate = useAnimationContext();

	const icon = createMemo(() => GuildStore.getIconUrl(props.id, 96, doAnimate()));

	return (
		<Show when={icon()} fallback={<div class="guild-icon acronym">{GuildStore.getAcronym(props.id)}</div>}>
			<img class="guild-icon icon" src={icon()} />
		</Show>
	);
}

function Indicator(props: { id: string }): JSX.Element {
	return (
		<div class="indicator">
			<span class="pill" />
		</div>
	);
}

export function MuteMenu(props: {
	endTime?: () => Date | undefined;
	isMuted: boolean;
	mute: (seconds?: number) => void;
	resource: string;
	unmute: () => void;
}): JSX.Element {
	return (
		<Show
			when={props.isMuted}
			fallback={
				<SubMenu label={`Mute ${props.resource}`} action={() => props.mute()}>
					<Item label="For 15 minutes" action={() => props.mute(15 * 60)} />
					<Item label="For 1 hour" action={() => props.mute(60 * 60)} />
					<Item label="For 3 hours" action={() => props.mute(3 * 60 * 60)} />
					<Item label="For 8 hours" action={() => props.mute(8 * 60 * 60)} />
					<Item label="For 24 hours" action={() => props.mute(24 * 60 * 60)} />
					<Item label="Until I turn it back on" action={() => props.mute()} />
				</SubMenu>
			}
		>
			<Item
				label={`Unmute ${props.resource}`}
				action={() => props.unmute()}
				subText={props.endTime && props.endTime() ? `Muted until ${props.endTime()!.toDateString()}` : undefined}
			/>
		</Show>
	);
}

function GuildContextmenu(props: { guildId: string }): JSX.Element {
	const notificationLevel = createMemo(() => SettingsStore.getGuildNotificationLevel(props.guildId));

	return (
		<>
			<Item label="Mark as Read" />
			<Separator />
			<Item label="Invite People" color={Colors.GREEN} />
			<Separator />
			<MuteMenu
				resource="Server"
				isMuted={SettingsStore.userGuildSettings[props.guildId]?.muted ?? false}
				mute={(seconds) => SettingsStore.muteGuild(props.guildId, seconds)}
				unmute={() => SettingsStore.unmuteGuild(props.guildId)}
				endTime={() => {
					const endTime = SettingsStore.userGuildSettings[props.guildId]?.mute_config?.end_time;
					return endTime ? new Date(endTime) : undefined;
				}}
			/>
			<SubMenu label="Notification Settings" subText={notificationLevelToText(notificationLevel())}>
				<Choice
					get={notificationLevel}
					set={(next) => SettingsStore.setGuildNotificationLevel(props.guildId, next)}
					choices={[
						{
							label: notificationLevelToText(NotificationLevel.ALL_MESSAGES),
							value: NotificationLevel.ALL_MESSAGES,
						},
						{
							label: notificationLevelToText(NotificationLevel.ONLY_MENTIONS),
							value: NotificationLevel.ONLY_MENTIONS,
						},
						{
							label: notificationLevelToText(NotificationLevel.NOTHING),
							value: NotificationLevel.NOTHING,
						},
					]}
				/>
				<Separator />
				<Switch
					label="Suppress @everyone and @here"
					enabled={() => SettingsStore.userGuildSettings[props.guildId]?.suppress_everyone ?? false}
					set={() => SettingsStore.toggleSuppressEveryone(props.guildId)}
				/>
				<Switch
					label="Suppress All Role @mentions"
					enabled={() => SettingsStore.userGuildSettings[props.guildId]?.suppress_roles ?? false}
					set={() => SettingsStore.toggleSuppressRoles(props.guildId)}
				/>
				<Switch
					label="Suppress Highlights"
					enabled={() =>
						(SettingsStore.userGuildSettings[props.guildId]?.notify_highlights ?? HighlightLevel.DEFAULT) === HighlightLevel.DISABLED
					}
					set={() => SettingsStore.toggleSuppressHighlights(props.guildId)}
				/>
				<Switch
					label="Mute Scheduled Events"
					enabled={() => SettingsStore.userGuildSettings[props.guildId]?.mute_scheduled_events ?? false}
					set={() => SettingsStore.toggleMuteScheduledEvents(props.guildId)}
				/>
				<Separator />
				<Switch
					label="Mobile Push Notifications"
					enabled={() => SettingsStore.userGuildSettings[props.guildId]?.mobile_push ?? false}
					set={() => SettingsStore.toggleMobilePush(props.guildId)}
				/>
			</SubMenu>
			<Switch
				label="Hide Muted Channels"
				enabled={() => SettingsStore.userGuildSettings[props.guildId]?.hide_muted_channels ?? false}
				set={() => SettingsStore.toggleHideMutedChannels(props.guildId)}
			/>
			<Separator />
			// TODO: Server Settings // Privacy Settings
			<Item label="Edit Server Profile" />
			// Create Category, Channel, Event
			<Separator />
			<Show when={true}>
				<Item label="Leave Server" color={Colors.RED} />
				<Separator />
			</Show>
			<Id id={props.guildId} of="Server" />
		</>
	);
}

export default function Guild(props: { id: string }): JSX.Element {
	const guild = createMemo(() => GuildStore.getGuild(props.id));
	const location = useLocationContext();

	return (
		<Show when={!GuildStore.isUnavailable(props.id) && guild()} fallback={<div class={`guild guild-${props.id} unavailable`} />}>
			<div
				classList={{
					available: true,
					guild: true,
					[`guild-${props.id}`]: true,
					selected: location().selectedGuild(props.id),
				}}
			>
				<Indicator id={props.id} />
				<A href={`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`}>
					<div
						class="guild-icon-container"
						use:tippy={{
							content: () => guild()?.name,
							props: { placement: "right" },
						}}
						use:HoverAnimationDirective
						use:ContextmenuDirective={{
							menu: () => <GuildContextmenu guildId={props.id} />,
						}}
					>
						<ImageOrAcronym id={props.id} />
					</div>
				</A>
			</div>
		</Show>
	);
}
