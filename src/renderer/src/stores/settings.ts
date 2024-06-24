import { batch, createSignal, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import { channel_override, guild_settings_entry } from "@constants/schemata/settings";
import { HighlightLevel, NotificationLevel, UserSettingsType } from "@constants/schemata/settings";

import Api from "@modules/api";
import { on, once } from "@modules/dispatcher";

import Store from ".";
import { getGuildChannel } from "./channels";

import { FrecencyUserSettings, PreloadedUserSettings } from "discord-protos";

export function notificationLevelToText(level: NotificationLevel, isTopLevel?: boolean): string {
	switch (level) {
		case NotificationLevel.ALL_MESSAGES:
			return "All Messages";
		case NotificationLevel.ONLY_MENTIONS:
			return "Only @mentions";
		case NotificationLevel.NOTHING:
			return "Nothing";
		case NotificationLevel.PARENT_DEFAULT:
			return isTopLevel ? "Use Server Default" : "Use Category Default";
		default:
			throw new Error("Unknown notification level");
	}
}

const [frecencySettings, setFrecencySettings] = createStore<FrecencyUserSettings>({});
const [preloadedSettings, setPreloadedSettings] = createStore<PreloadedUserSettings>({});
const [userGuildSettings, setUserGuildSettings] = createStore<{
	[guild_id: string]: DistributiveOmit<InferOutput<typeof guild_settings_entry>, "guild_id" | "channel_overrides"> & {
		overridden_channel_ids?: string[];
	};
}>({});
// this also belongs to the userGuildSettings, just pulled it out for easier access
const [channelOverrides, setChannelOverrides] = createStore<{
	[channel_id: string]: DistributiveOmit<InferOutput<typeof channel_override>, "channel_id">;
}>({});
const [userGuildSettingsVersion, setUserGuildSettingsVersion] = createSignal<number>(0);

const muteTimers = new Map<string, NodeJS.Timeout>();
function registerTimedChannelMute(channelId: string, config: { end_time: string | null; selected_time_window: number }): void {
	if (muteTimers.has(channelId)) clearTimeout(muteTimers.get(channelId)!);
	if (!config.end_time) return; // timer expired

	const end = new Date(config.end_time).getTime();
	const now = Date.now();
	if (end < now) return;

	const timer = setTimeout(() => {
		setChannelOverrides(channelId, "muted", false);
	}, end - now);
	muteTimers.set(channelId, timer);
}
function registerTimedGuildMute(guildId: string, config: { end_time: string | null; selected_time_window: number }): void {
	if (muteTimers.has(guildId)) clearTimeout(muteTimers.get(guildId)!);
	if (!config.end_time) return; // timer expired

	const end = new Date(config.end_time).getTime();
	const now = Date.now();
	if (end < now) return;

	const timer = setTimeout(() => {
		setUserGuildSettings(guildId, "muted", false);
	}, end - now);
	muteTimers.set(guildId, timer);
}

const channelOverrideDefaults: DistributiveOmit<InferOutput<typeof channel_override>, "channel_id"> = Object.freeze({
	collapsed: false,
	message_notifications: NotificationLevel.PARENT_DEFAULT,
	mute_config: null,
	muted: false,
});

const guildSettingsDefaults: DistributiveOmit<InferOutput<typeof guild_settings_entry>, "guild_id" | "channel_overrides"> = Object.freeze({
	flags: 0,
	hide_muted_channels: false,
	message_notifications: NotificationLevel.ONLY_MENTIONS,
	mobile_push: true,
	mute_config: null,
	mute_scheduled_events: false,
	muted: false,
	notify_highlights: HighlightLevel.DEFAULT,
	suppress_everyone: false,
	suppress_roles: false,
	version: 0,
});

// thanks SO https://stackoverflow.com/a/21797381
export function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

on("READY", ({ user_settings_proto, user_guild_settings }) => {
	// TODO: set status from settings
	batch(() => {
		setPreloadedSettings(PreloadedUserSettings.fromBinary(base64ToUint8Array(user_settings_proto)));

		if (!user_guild_settings) return;
		if (user_guild_settings.partial) throw new Error("Partial updates are not supported");

		setUserGuildSettingsVersion(user_guild_settings.version);
		for (const entry of user_guild_settings.entries ?? []) {
			const { guild_id, channel_overrides, ...rest } = entry;
			setUserGuildSettings(guild_id as string, rest);
			if (channel_overrides)
				setUserGuildSettings(
					guild_id as string,
					"overridden_channel_ids",
					channel_overrides.map((o) => o.channel_id),
				);
			if (entry.mute_config && entry.muted) registerTimedGuildMute(guild_id as string, entry.mute_config);

			for (const override of channel_overrides ?? []) {
				const { channel_id, ...rest } = override;
				setChannelOverrides(channel_id, rest);
				if (override.mute_config && override.muted) registerTimedChannelMute(channel_id, override.mute_config);
			}
		}
	});
});

on("USER_GUILD_SETTINGS_UPDATE", ({ guild_id, channel_overrides, ...rest }) => {
	const lastVersion = userGuildSettings[guild_id as string];
	if (lastVersion) {
		for (const o of lastVersion.overridden_channel_ids ?? []) {
			if (muteTimers.has(o)) clearTimeout(muteTimers.get(o)!);
		}
		setChannelOverrides(
			produce((p) => {
				for (const o of lastVersion.overridden_channel_ids ?? []) {
					delete p[o];
				}
			}),
		);
	}

	setUserGuildSettings(guild_id as string, rest);
	if (rest.mute_config && rest.muted) registerTimedGuildMute(guild_id as string, rest.mute_config);

	for (const override of channel_overrides ?? []) {
		const { channel_id, ...rest } = override;
		setChannelOverrides(channel_id, rest);
		if (override.mute_config && override.muted) registerTimedChannelMute(channel_id, override.mute_config);
	}

	setUserGuildSettingsVersion(rest.version);
});

on("USER_SETTINGS_PROTO_UPDATE", ({ partial, settings }) => {
	if (partial) throw new Error("Partial updates are not supported");
	switch (settings.type) {
		case UserSettingsType.FRECENCY_AND_FAVORITES_SETTINGS:
			setFrecencySettings(FrecencyUserSettings.fromBinary(base64ToUint8Array(settings.proto)));
			break;
		case UserSettingsType.PRELOADED_USER_SETTINGS:
			setPreloadedSettings(PreloadedUserSettings.fromBinary(base64ToUint8Array(settings.proto)));
			break;
		default:
			throw new Error("Unknown settings type");
	}
});

once("GATEWAY_CONNECT", async () => {
	const res = await Api.getSettingsProto(UserSettingsType.FRECENCY_AND_FAVORITES_SETTINGS);
	setFrecencySettings(FrecencyUserSettings.fromBinary(base64ToUint8Array(res.settings)));
});

// TODO: redo all of this
export default new (class s extends Store {
	constructor() {
		super({});
	}

	preloadedSettings = preloadedSettings;
	frecencySettings = frecencySettings;
	userGuildSettings = userGuildSettings;
	channelOverrides = channelOverrides;

	getChannelNotificationLevel(channelId: string): NotificationLevel {
		const ch = channelOverrides[channelId];
		if (!ch) return NotificationLevel.PARENT_DEFAULT;
		return ch.message_notifications;
	}

	getGuildNotificationLevel(guildId: string): NotificationLevel {
		const guild = userGuildSettings[guildId];
		if (!guild) return guildSettingsDefaults.message_notifications;
		return guild.message_notifications;
	}

	resolveChannelNotificationLevel(channelId: string | undefined, guildId: string, parentChannelId?: string): NotificationLevel {
		if (!channelId) return this.getGuildNotificationLevel(guildId);
		const ch = getGuildChannel(channelId);
		if (!ch) throw new Error("Unknown channel");
		const override = channelOverrides[channelId];

		if (override && override.message_notifications !== NotificationLevel.PARENT_DEFAULT) return override.message_notifications;
		if (parentChannelId) return this.resolveChannelNotificationLevel(parentChannelId, guildId);

		return this.getGuildNotificationLevel(guildId);
	}

	toggleCollapsed(channelId: string): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, { ...channelOverrideDefaults });
		setChannelOverrides(
			channelId,
			"collapsed",
			untrack(() => !ch?.collapsed),
		);
	}

	collapse(channelId: string): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, { ...channelOverrideDefaults });
		setChannelOverrides(channelId, "collapsed", true);
	}

	muteChannel(channelId: string, seconds?: number): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, { ...channelOverrideDefaults });
		setChannelOverrides(channelId, "muted", true);
		if (seconds) {
			const end = new Date(Date.now() + seconds * 1000).toISOString();
			setChannelOverrides(channelId, "mute_config", { end_time: end, selected_time_window: seconds });
			registerTimedChannelMute(channelId, { end_time: end, selected_time_window: seconds });
		}
	}

	unmuteChannel(channelId: string): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (muteTimers.has(channelId)) clearTimeout(muteTimers.get(channelId)!);
		if (!ch) return;
		setChannelOverrides(channelId, "muted", false);
		setChannelOverrides(channelId, "mute_config", null);
	}

	muteGuild(guildId: string, seconds?: number): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(guildId, "muted", true);
		if (seconds) {
			const end = new Date(Date.now() + seconds * 1000).toISOString();
			setUserGuildSettings(guildId, "mute_config", { end_time: end, selected_time_window: seconds });
			registerTimedGuildMute(guildId, { end_time: end, selected_time_window: seconds });
		}
	}

	unmuteGuild(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (muteTimers.has(guildId)) clearTimeout(muteTimers.get(guildId)!);
		if (!guild) return;
		setUserGuildSettings(guildId, "muted", false);
		setUserGuildSettings(guildId, "mute_config", null);
	}

	toggleHideMutedChannels(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"hide_muted_channels",
			untrack(() => !guild?.hide_muted_channels),
		);
	}

	setChannelNotificationLevel(channelId: string, level: NotificationLevel): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, { ...channelOverrideDefaults });
		setChannelOverrides(channelId, "message_notifications", level);
	}

	setGuildNotificationLevel(guildId: string, level: NotificationLevel): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(guildId, "message_notifications", level);
	}

	toggleSuppressEveryone(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"suppress_everyone",
			untrack(() => !guild?.suppress_everyone),
		);
	}

	toggleSuppressRoles(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"suppress_roles",
			untrack(() => !guild?.suppress_roles),
		);
	}

	toggleSuppressHighlights(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"notify_highlights",
			untrack(() => guild?.notify_highlights) === HighlightLevel.DISABLED ? HighlightLevel.ENABLED : HighlightLevel.DISABLED,
		);
	}

	toggleMuteScheduledEvents(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"mute_scheduled_events",
			untrack(() => !guild?.mute_scheduled_events),
		);
	}

	toggleMobilePush(guildId: string): void {
		const guild = untrack(() => userGuildSettings[guildId]);
		if (!guild) setUserGuildSettings(guildId, { ...guildSettingsDefaults });
		setUserGuildSettings(
			guildId,
			"mobile_push",
			untrack(() => !guild?.mobile_push),
		);
	}
})();
