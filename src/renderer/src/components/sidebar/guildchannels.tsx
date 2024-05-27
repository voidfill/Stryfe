import { A } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, onCleanup, Show, untrack } from "solid-js";

import { ChannelTypes } from "@constants/channel";
import permissions from "@constants/permissions";

import ChannelStore from "@stores/channels";
import GuildStore from "@stores/guilds";
import MemberStore from "@stores/members";
import SettingsStore from "@stores/settings";
import UserStore from "@stores/users";
import VoiceStateStore from "@stores/voicestates";

import { FaSolidChevronDown } from "solid-icons/fa";
import { TbMicrophoneOff } from "solid-icons/tb";
import { TbHeadphonesOff } from "solid-icons/tb";

import { HoverAnimationDirective } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";
import ChannelIcon from "../common/channelicon";
import { useLocationContext } from "../common/locationcontext";
import OverflowTooltip from "../common/overflowtooltip";
import { usePermissionsContext } from "../common/permissionscontext";

HoverAnimationDirective;
OverflowTooltip;

const refMap = new Map<string, any>();

function TextChannel(props: { id: string; isCollapsed: Accessor<boolean>; parentId?: string }): JSX.Element {
	const location = useLocationContext();
	const channel = createMemo(() => ChannelStore.getGuildTextChannel(props.id));
	const mutedHide = createMemo(
		() => (SettingsStore.userGuildSettings[location().guildId]?.hide_muted_channels && SettingsStore.channelOverrides[props.id]?.muted) ?? false,
	);

	const currentPermissions = usePermissionsContext();
	const canSee = createMemo(() => currentPermissions().can(permissions.VIEW_CHANNEL, props.id));

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={((!(props.isCollapsed() || mutedHide()) && canSee()) || location().selectedChannel(props.id)) && channel()}>
			{(c): JSX.Element => (
				<A
					href={`/channels/${location().guildId}/${props.id}`}
					ref={(el): void => {
						refMap.set(props.id, el);
					}}
				>
					<div
						classList={{
							channel: true,
							[`channel-type-${c().type}`]: true,
							[`channel-${props.id}`]: true,
							selected: location().selectedChannel(props.id),
						}}
					>
						<div class="channel-icon">
							<ChannelIcon guildId={location().guildId} id={props.id} size={20} />
						</div>
						<span class="channel-name" use:OverflowTooltip={() => c().name}>
							{c().name}
						</span>
					</div>
				</A>
			)}
		</Show>
	);
}

function VoiceCard(props: { sessionId: string }): JSX.Element {
	const voiceState = createMemo(() => VoiceStateStore.getVoiceState(props.sessionId));
	const member = createMemo(() => MemberStore.getMember(voiceState()?.guild_id ?? "", voiceState()?.user_id ?? ""));
	const user = createMemo(() => UserStore.getUser(voiceState()?.user_id ?? ""));

	return (
		<Show when={voiceState()}>
			{(vs): JSX.Element => (
				<div classList={{ "voice-card": true, [`voice-user-id-${vs().user_id}`]: true }} use:HoverAnimationDirective>
					<Avatar userId={vs().user_id} guildId={vs().guild_id ?? undefined} size={24} showStatus={ShowStatus.NEVER} />
					<span class="username">
						<Show when={member() && member()?.nick} fallback={user()?.display_name || user()?.username}>
							{member()?.nick}
						</Show>
					</span>
					<Show when={vs().mute || vs().self_mute}>
						<TbMicrophoneOff style={vs().mute ? { color: "#ff372c" } : {}} />
					</Show>
					<Show when={vs().deaf || vs().self_deaf}>
						<TbHeadphonesOff style={vs().deaf ? { color: "#ff372c" } : {}} />
					</Show>
				</div>
			)}
		</Show>
	);
}

function VoiceChannel(props: { id: string; isCollapsed: Accessor<boolean> }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildVoiceChannel(props.id));
	const location = useLocationContext();
	const mutedHide = createMemo(
		() => (SettingsStore.userGuildSettings[location().guildId]?.hide_muted_channels && SettingsStore.channelOverrides[props.id]?.muted) ?? false,
	);
	const voiceStates = createMemo(() => VoiceStateStore.getSessionIdsForChannel(props.id));
	// TODO: sort by name, streaming, camera etc
	// TODO: maybe add a specific list for users that are on stage? filtering onchange voice states seems like a bad idea

	const currentPermissions = usePermissionsContext();
	const canSee = createMemo(() => currentPermissions().can(permissions.VIEW_CHANNEL, props.id));

	onCleanup(() => {
		refMap.delete(props.id);
	});

	return (
		<Show when={((!(props.isCollapsed() || mutedHide()) && canSee()) || location().selectedChannel(props.id)) && channel()}>
			{(c): JSX.Element => (
				<>
					<A
						href={`/channels/${location().guildId}/${props.id}`}
						ref={(el): void => {
							refMap.set(props.id, el);
						}}
					>
						<div
							classList={{
								channel: true,
								[`channel-type-${c().type}`]: true,
								[`channel-${props.id}`]: true,
								selected: location().selectedChannel(props.id),
							}}
						>
							<div class="channel-icon">
								<ChannelIcon guildId={location().guildId} id={props.id} size={20} />
							</div>
							<span class="channel-name" use:OverflowTooltip={() => c().name}>
								{c().name}
							</span>
						</div>
					</A>
					<Show when={c().type === ChannelTypes.GUILD_VOICE}>
						<For each={voiceStates()}>{(sessionId): JSX.Element => <VoiceCard sessionId={/*@once*/ sessionId} />}</For>
					</Show>
				</>
			)}
		</Show>
	);
}

function Category(props: { id: string; other: string[]; voice: string[] }): JSX.Element {
	const category = createMemo(() => ChannelStore.getGuildCategoryChannel(props.id));
	const isCollapsed = createMemo(() => SettingsStore.channelOverrides[props.id]?.collapsed ?? false);
	const currentPermissions = usePermissionsContext();

	const mapFn = (id: string): boolean => currentPermissions().can(permissions.VIEW_CHANNEL, id);
	const canSeeChild = createMemo(() => props.other.some(mapFn) || props.voice.some(mapFn));
	const canSee = createMemo(
		() => (!props.other.length && !props.voice.length && currentPermissions().can(permissions.MANAGE_CHANNELS, props.id)) || canSeeChild(),
	);

	onCleanup(() => {
		refMap.delete(props.id); // not sure yet if we need to have categories in the refmap but we'll see
	});

	return (
		<Show when={canSee() && category()}>
			{(c): JSX.Element => (
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
						<span class="channel-name" use:OverflowTooltip={() => c().name}>
							{c().name}
						</span>
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
	const location = useLocationContext();
	const channels = createMemo(() => ChannelStore.getSortedGuildChannels(location().guildId));
	const guildName = createMemo(() => GuildStore.getGuild(location().guildId)?.name);
	let ref: HTMLDivElement;

	createEffect(() => {
		const pos = scrollPositions.get(location().guildId);
		if (!ref) return;
		if (pos || pos === 0) return void ref.scrollTo({ behavior: "instant", top: pos });
		refMap.get(untrack(() => location().channelId))?.scrollIntoView({ behavior: "instant", block: "center" });
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
					// @ts-expect-error ref
					ref
				}
				onScroll={(): void => {
					lastKnownScrollPosition = ref.scrollTop;
					if (!ticking) {
						window.requestAnimationFrame(() => {
							scrollPositions.set(location().guildId, lastKnownScrollPosition);
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
