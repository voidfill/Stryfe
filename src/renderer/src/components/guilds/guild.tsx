import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import permissions from "@constants/permissions";
import { HighlightLevel, NotificationLevel } from "@constants/schemata/settings";

import { getAcronym, getFeatures, getGuild, getIconUrl, isOwner } from "@stores/guilds";
import { can, computeBasePermissions } from "@stores/permissions";
import {
	muteGuild,
	notificationLevelToText,
	setGuildNotificationLevel,
	setHideMutedChannels,
	setMobilePush,
	setMuteScheduledEvents,
	setNotifyHighlights,
	setSuppressEveryone,
	setSuppressRoles,
	unmuteGuild,
	userGuildSettings,
} from "@stores/settings";
import { guildSettingsDefaults } from "@stores/settings";
import { getSelfId } from "@stores/users";

import { HoverAnimationDirective, useAnimationContext } from "@components/common/animationcontext";
import { Choice, ChoiceGroup, Colors, ContextmenuDirective, Id, Item, Separator, SubMenu, Switch, ViewRaw } from "@components/common/contextmenu";
import tippy from "@components/common/tooltip";
import { arbitrary } from "@components/common/usearbitrary";

import { GuildAccessories } from "./accessories";

import { lastSelectedChannels } from "@renderer/signals";
import { createDraggable } from "@thisbeyond/solid-dnd";

arbitrary;
tippy;
HoverAnimationDirective;
ContextmenuDirective;

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
	const notificationLevel = createMemo(() => (userGuildSettings[props.guildId] ?? guildSettingsDefaults()).message_notifications);
	const basePermissions = createMemo(() => computeBasePermissions(props.guildId, getSelfId()));
	const canCreateEvents = createMemo(() =>
		can({
			basePermissions: basePermissions(),
			guildId: props.guildId,
			memberId: getSelfId(),
			toCheck: permissions.CREATE_EVENTS,
		}),
	);
	const canManageChannels = createMemo(() =>
		can({
			basePermissions: basePermissions(),
			guildId: props.guildId,
			memberId: getSelfId(),
			toCheck: permissions.MANAGE_CHANNELS,
		}),
	);
	const owner = createMemo(() => isOwner(props.guildId, getSelfId()));
	const gs = createMemo(() => userGuildSettings[props.guildId] ?? guildSettingsDefaults());

	return (
		<>
			<Item label="Mark as Read" />
			<Separator />
			<Item label="Invite People" color={Colors.GREEN} />
			<Separator />
			<MuteMenu
				resource="Server"
				isMuted={userGuildSettings[props.guildId]?.muted ?? false}
				mute={(seconds) => muteGuild(props.guildId, seconds)}
				unmute={() => unmuteGuild(props.guildId)}
				endTime={() => {
					const endTime = userGuildSettings[props.guildId]?.mute_config?.end_time;
					return endTime ? new Date(endTime) : undefined;
				}}
			/>
			<SubMenu label="Notification Settings" subText={notificationLevelToText(notificationLevel())}>
				<ChoiceGroup current={notificationLevel()} set={(next) => setGuildNotificationLevel(props.guildId, next)}>
					<Choice label={notificationLevelToText(NotificationLevel.ALL_MESSAGES)} value={NotificationLevel.ALL_MESSAGES} />
					<Choice label={notificationLevelToText(NotificationLevel.ONLY_MENTIONS)} value={NotificationLevel.ONLY_MENTIONS} />
					<Choice label={notificationLevelToText(NotificationLevel.NOTHING)} value={NotificationLevel.NOTHING} />
				</ChoiceGroup>
				<Separator />
				<Switch
					label="Suppress @everyone and @here"
					enabled={() => gs().suppress_everyone}
					set={() => setSuppressEveryone(props.guildId, !gs().suppress_everyone)}
				/>
				<Switch
					label="Suppress All Role @mentions"
					enabled={() => gs().suppress_roles}
					set={() => setSuppressRoles(props.guildId, !gs().suppress_roles)}
				/>
				<Switch
					label="Suppress Highlights"
					enabled={() => gs().notify_highlights === HighlightLevel.DISABLED}
					set={() =>
						setNotifyHighlights(
							props.guildId,
							gs().notify_highlights === HighlightLevel.DISABLED ? HighlightLevel.ENABLED : HighlightLevel.DISABLED,
						)
					}
				/>
				<Switch
					label="Mute Scheduled Events"
					enabled={() => gs().mute_scheduled_events}
					set={() => setMuteScheduledEvents(props.guildId, !gs().mute_scheduled_events)}
				/>
				<Separator />
				<Switch
					label="Mobile Push Notifications"
					enabled={() => gs().mobile_push}
					set={() => setMobilePush(props.guildId, !gs().mobile_push)}
				/>
			</SubMenu>
			<Switch
				label="Hide Muted Channels"
				enabled={() => gs().hide_muted_channels}
				set={() => setHideMutedChannels(props.guildId, !gs().hide_muted_channels)}
			/>
			<Separator />
			<Show when={false /* TODO: figure out when and what to show */}>
				<SubMenu label="Server Settings">
					<Item label="Overview" />
				</SubMenu>
			</Show>
			<Item label="Privacy Settings" />
			<Item label="Edit Server Profile" />
			<Separator />
			<Show when={canCreateEvents()}>
				<Item label="Create Event" />
			</Show>
			<Show when={canManageChannels()}>
				<Item label="Create Channel" />
				<Item label="Create Category" />
			</Show>
			<Show when={canCreateEvents() || canManageChannels()}>
				<Separator />
			</Show>
			<Show when={!owner()}>
				<Item label="Leave Server" color={Colors.RED} />
				<Separator />
			</Show>
			<Id id={props.guildId} resource="Server" />
			<ViewRaw Guild={() => getGuild(props.guildId)} Features={() => getFeatures(props.guildId)} />
		</>
	);
}

export function GuildIcon(props: { id: string }): JSX.Element {
	const guild = createMemo(() => getGuild(props.id));
	const doAnimate = useAnimationContext();

	return (
		<Show when={guild()}>
			{(guild) => (
				<Show when={guild().icon} fallback={<div class="icon guild-acronym">{getAcronym(props.id)}</div>}>
					<img class="icon" src={getIconUrl(props.id, 96, doAnimate())} draggable={false} />
				</Show>
			)}
		</Show>
	);
}

export function GuildWrapper(props: { id: string; parentId?: string }): JSX.Element {
	const nav = useNavigate();
	const params = useParams();

	const guild = createMemo(() => getGuild(props.id));
	const isSelected = createMemo(() => params.guildId === props.id);
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { id: props.id, parentId: props.parentId, type: "guild" });

	return (
		<Show when={guild()}>
			{(guild) => (
				<div classList={{ "active-draggable": draggable?.isActiveDraggable, guild: true, selected: isSelected() }}>
					<div class="indicator" />
					<div
						class="container-wrapper"
						onClick={() => nav(`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`)}
						use:arbitrary={[draggable]}
						use:HoverAnimationDirective
						use:tippy={{ content: () => guild().name, props: { offset: [0, 20], placement: "right" } }}
						use:ContextmenuDirective={() => <GuildContextmenu guildId={props.id} />}
					>
						<GuildAccessories guildId={props.id}>
							<div classList={{ acronym: !guild().icon, "icon-container": true }}>
								<Show when={!draggable.isActiveDraggable}>
									<GuildIcon id={props.id} />
								</Show>
							</div>
						</GuildAccessories>
					</div>
				</div>
			)}
		</Show>
	);
}
