import { A } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import GuildStore from "@stores/guilds";
import SettingsStore, { HighlightLevel, NotificationLevel, notificationLevelToText } from "@stores/settings";
import UserStore from "@stores/users";

import { tippy } from "@components/common/tooltip";

import { HoverAnimationDirective, useAnimationContext } from "../common/animationcontext";
import { Colors, ContextmenuDirective, Id, Optional, Separator } from "../common/contextmenu";
import { useSelectedGuildContext } from "../common/selectioncontext";

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

export default function Guild(props: { id: string }): JSX.Element {
	const guild = createMemo(() => GuildStore.getGuild(props.id));
	const selg = useSelectedGuildContext();
	const notificationLevel = createMemo(() => SettingsStore.getGuildNotificationLevel(props.id));

	return (
		<Show when={!GuildStore.isUnavailable(props.id) && guild()} fallback={<div class={`guild guild-${props.id} unavailable`} />}>
			<div
				classList={{
					available: true,
					guild: true,
					[`guild-${props.id}`]: true,
					selected: selg(props.id),
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
							menu: () => [
								{
									action: (): void => {},
									label: "Mark as Read",
									type: "text",
								},
								Separator,
								{
									action: (): void => {},
									label: "Invite People",
									type: "text",
								},
								Separator,
								SettingsStore.userGuildSettings[props.id]?.muted
									? {
											action: () => SettingsStore.unmuteGuild(props.id),
											label: "Unmute Server",
											subText: SettingsStore.userGuildSettings[props.id]?.mute_config?.end_time
												? `Muted until ${SettingsStore.userGuildSettings[props.id]?.mute_config?.end_time}`
												: undefined,
									  }
									: {
											action: () => SettingsStore.muteGuild(props.id),
											label: "Mute Server",
											submenu: [
												{
													action: () => SettingsStore.muteGuild(props.id, 15 * 60),
													label: "For 15 Minutes",
													type: "text",
												},
												{
													action: () => SettingsStore.muteGuild(props.id, 60 * 60),
													label: "For 1 Hour",
													type: "text",
												},
												{
													action: () => SettingsStore.muteGuild(props.id, 3 * 60 * 60),
													label: "For 3 Hours",
													type: "text",
												},
												{
													action: () => SettingsStore.muteGuild(props.id, 8 * 60 * 60),
													label: "For 8 Hours",
													type: "text",
												},
												{
													action: () => SettingsStore.muteGuild(props.id, 24 * 60 * 60),
													label: "For 24 Hours",
													type: "text",
												},
												{
													action: () => SettingsStore.muteGuild(props.id),
													label: "Until i turn it back on",
													type: "text",
												},
											],
											type: "submenu",
									  },
								{
									action: (): void => {},
									label: "Notification Settings",
									subText: notificationLevelToText(notificationLevel()),
									submenu: [
										{
											action: () => SettingsStore.setGuildNotificationLevel(props.id, NotificationLevel.ALL_MESSAGES),
											enabled: () => notificationLevel() === NotificationLevel.ALL_MESSAGES,
											label: notificationLevelToText(NotificationLevel.ALL_MESSAGES),
											type: "switch",
										},
										{
											action: () => SettingsStore.setGuildNotificationLevel(props.id, NotificationLevel.ONLY_MENTIONS),
											enabled: () => notificationLevel() === NotificationLevel.ONLY_MENTIONS,
											label: notificationLevelToText(NotificationLevel.ONLY_MENTIONS),
											type: "switch",
										},
										{
											action: () => SettingsStore.setGuildNotificationLevel(props.id, NotificationLevel.NOTHING),
											enabled: () => notificationLevel() === NotificationLevel.NOTHING,
											label: notificationLevelToText(NotificationLevel.NOTHING),
											type: "switch",
										},
										Separator,
										{
											action: () => SettingsStore.toggleSuppressEveryone(props.id),
											enabled: () => SettingsStore.userGuildSettings[props.id]?.suppress_everyone ?? false,
											label: "Suppress @everyone and @here",
											type: "switch",
										},
										{
											action: () => SettingsStore.toggleSuppressRoles(props.id),
											enabled: () => SettingsStore.userGuildSettings[props.id]?.suppress_roles ?? false,
											label: "Suppress All Role @mentions",
											type: "switch",
										},
										{
											action: () => SettingsStore.toggleSuppressHighlights(props.id),
											enabled: () =>
												(SettingsStore.userGuildSettings[props.id]?.notify_highlights ?? HighlightLevel.DEFAULT) ===
												HighlightLevel.DISABLED,
											label: "Suppress Highlights",
											type: "switch",
										},
										{
											action: () => SettingsStore.toggleMuteScheduledEvents(props.id),
											enabled: () => SettingsStore.userGuildSettings[props.id]?.mute_scheduled_events ?? false,
											label: "Mute Scheduled Events",
											type: "switch",
										},
										Separator,
										{
											action: () => SettingsStore.toggleMobilePush(props.id),
											enabled: () => SettingsStore.userGuildSettings[props.id]?.mobile_push ?? false,
											label: "Mobile Push Notifications",
											type: "switch",
										},
									],
									type: "submenu",
								},
								{
									action: (): void => {
										SettingsStore.toggleHideMutedChannels(props.id);
									},
									enabled: () => SettingsStore.userGuildSettings[props.id]?.hide_muted_channels ?? false,
									label: "Hide Muted Channels",
									type: "switch",
								},
								Separator,
								// Server Settings
								// Privacy Settings
								{
									action: (): void => {},
									label: "Edit Server Profile",
									type: "text",
								},
								// Edit Server Profile
								// Create event
								Separator,
								...Optional(guild()?.owner_id !== UserStore.getSelfId(), [
									{
										action: (): void => {},
										color: Colors.RED,
										label: "Leave Server",
										type: "text",
									},
									Separator,
								]),
								Id(props.id, "Copy Server ID"),
							],
						}}
					>
						<ImageOrAcronym id={props.id} />
					</div>
				</A>
			</div>
		</Show>
	);
}
