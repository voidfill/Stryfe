import { createMemo, JSX, Show } from "solid-js";

import GuildStore from "@stores/guilds";
import SettingsStore from "@stores/settings";
import UserStore from "@stores/users";

import { HoverAnimationDirective, useAnimationContext } from "../common/animationcontext";
import { Colors, ContextmenuDirective, Id, Optional, Separator } from "../common/contextmenu";
import { useSelectedGuildContext } from "../common/selectioncontext";
import TooltipDirective, { TooltipColors, TooltipPosition } from "../common/tooltip";
import { lastSelectedChannels } from "../mainview";
HoverAnimationDirective;
TooltipDirective;
ContextmenuDirective;

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
				<a href={`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`}>
					<div
						class="guild-icon-container"
						use:HoverAnimationDirective
						use:TooltipDirective={{
							color: TooltipColors.BLACK,
							content: () => <div>{guild()?.name}</div>,
							position: TooltipPosition.RIGHT,
						}}
						use:ContextmenuDirective={{
							menu: [
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
								{
									action: (): void => {},
									label: "Mute Server",
									submenu: [
										{
											action: (): void => {},
											label: "For 15 Minutes",
											type: "text",
										},
										{
											action: (): void => {},
											label: "For 1 Hour",
											type: "text",
										},
										{
											action: (): void => {},
											label: "For 3 Hours",
											type: "text",
										},
										{
											action: (): void => {},
											label: "For 8 Hours",
											type: "text",
										},
										{
											action: (): void => {},
											label: "For 24 Hours",
											type: "text",
										},
										{
											action: (): void => {},
											label: "Until i turn it back on",
											type: "text",
										},
									],
									type: "submenu",
								},
								// Notification Settings
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
								...Optional(guild()?.owner_id !== UserStore.getSelfId(), {
									action: (): void => {},
									color: Colors.RED,
									label: "Leave Server",
									type: "text",
								}),
								Separator,
								Id(props.id, "Copy Server ID"),
							],
						}}
					>
						<ImageOrAcronym id={props.id} />
					</div>
				</a>
			</div>
		</Show>
	);
}
