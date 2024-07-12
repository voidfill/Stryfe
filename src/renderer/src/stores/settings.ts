import { Accessor, batch, createSignal, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import { channel_override, guild_settings_entry } from "@constants/schemata/settings";
import { HighlightLevel, NotificationLevel, UserSettingsType } from "@constants/schemata/settings";

import Api from "@modules/api";
import { on, once } from "@modules/dispatcher";

import { registerDebugStore } from ".";
import { setupGuildFolders } from "./guildfolders";

import { FrecencyUserSettings, PreloadedUserSettings } from "discord-protos";

type storedGuildSettings = DistributiveOmit<InferOutput<typeof guild_settings_entry>, "guild_id" | "channel_overrides"> & {
	overridden_channel_ids?: string[];
};
type storedChannelOverride = DistributiveOmit<InferOutput<typeof channel_override>, "channel_id">;

const [frecencySettings, setFrecencySettings] = createStore<FrecencyUserSettings>({});
const [preloadedSettings, setPreloadedSettings] = createStore<PreloadedUserSettings>({});
const [userGuildSettings, setUserGuildSettings] = createStore<{
	[guild_id: string]: storedGuildSettings;
}>({});
const [channelOverrides, setChannelOverrides] = createStore<{
	[channel_id: string]: storedChannelOverride;
}>({});
const [userGuildSettingsVersion, setUserGuildSettingsVersion] = createSignal<number>(0);

export { frecencySettings, preloadedSettings, userGuildSettings, channelOverrides, userGuildSettingsVersion };

// thanks SO https://stackoverflow.com/a/21797381
export function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

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

on("READY", ({ user_settings_proto, user_guild_settings }) => {
	// TODO: set status from settings
	batch(() => {
		setPreloadedSettings(PreloadedUserSettings.fromBinary(base64ToUint8Array(user_settings_proto)));
		setupGuildFolders(preloadedSettings.guildFolders?.folders ?? []);

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
			setupGuildFolders(preloadedSettings.guildFolders?.folders ?? []);

			break;
		default:
			throw new Error("Unknown settings type");
	}
});

once("GATEWAY_CONNECT", async () => {
	const res = await Api.getSettingsProto(UserSettingsType.FRECENCY_AND_FAVORITES_SETTINGS);
	setFrecencySettings(FrecencyUserSettings.fromBinary(base64ToUint8Array(res.settings)));
});

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

export const channelOverrideDefaults: Accessor<storedChannelOverride> = () => ({
	collapsed: false,
	message_notifications: NotificationLevel.PARENT_DEFAULT,
	mute_config: null,
	muted: false,
});

export const guildSettingsDefaults: Accessor<storedGuildSettings> = () => ({
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

function ensureChannelOverrides(channelId: string): void {
	untrack(() => {
		if (!channelOverrides[channelId]) setChannelOverrides(channelId, channelOverrideDefaults());
	});
}

function ensureGuildSettings(guildId: string): void {
	untrack(() => {
		if (!userGuildSettings[guildId]) setUserGuildSettings(guildId, guildSettingsDefaults());
	});
}

export function setCollapsed(channelId: string, value: boolean): void {
	ensureChannelOverrides(channelId);
	setChannelOverrides(channelId, "collapsed", value);
}

export function muteGuild(guildId: string, seconds?: number): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "muted", true);

	if (!seconds) return;
	const end = new Date(Date.now() + seconds * 1000).toISOString();
	setUserGuildSettings(guildId, "mute_config", { end_time: end, selected_time_window: seconds });
	registerTimedGuildMute(guildId, { end_time: end, selected_time_window: seconds });
}

export function unmuteGuild(guildId: string): void {
	if (muteTimers.has(guildId)) clearTimeout(muteTimers.get(guildId)!);
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "muted", false);
	setUserGuildSettings(guildId, "mute_config", null);
}

export function setGuildNotificationLevel(guildId: string, level: NotificationLevel): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "message_notifications", level);
}

export function setSuppressEveryone(guildId: string, value: boolean): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "suppress_everyone", value);
}

export function setSuppressRoles(guildId: string, value: boolean): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "suppress_roles", value);
}

export function setNotifyHighlights(guildId: string, level: HighlightLevel): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "notify_highlights", level);
}

export function setMuteScheduledEvents(guildId: string, value: boolean): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "mute_scheduled_events", value);
}

export function setMobilePush(guildId: string, value: boolean): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "mobile_push", value);
}

export function setHideMutedChannels(guildId: string, value: boolean): void {
	ensureGuildSettings(guildId);
	setUserGuildSettings(guildId, "hide_muted_channels", value);
}

registerDebugStore("settings", {
	state: {
		channelOverrides,
		frecencySettings,
		preloadedSettings,
		userGuildSettings,
		userGuildSettingsVersion,
	},
});
