import { batch, createSignal, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";

import Store from ".";
import ChannelStore from "./channels";

import { channel_override, guild_settings_entry } from "@renderer/constants/schemata/settings";
import { FrecencyUserSettings, PreloadedUserSettings } from "discord-protos";
import { Output } from "valibot";

export const enum UserSettingsType {
	PRELOADED_USER_SETTINGS = 1,
	FRECENCY_AND_FAVORITES_SETTINGS = 2,
	TEST_SETTINGS = 3, // explode
}

export const enum GuildNotificationLevel {
	ALL_MESSAGES = 0,
	ONLY_MENTIONS = 1,
	NOTHING = 2,
}

export const enum ChannelNotificationLevel {
	ALL_MESSAGES = 0,
	ONLY_MENTIONS = 1,
	NOTHING = 2,
	PARENT_DEFAULT = 3,
}

export function notificationLevelToText(level: GuildNotificationLevel | ChannelNotificationLevel): string {
	switch (level) {
		case GuildNotificationLevel.ALL_MESSAGES:
			return "All messages";
		case GuildNotificationLevel.ONLY_MENTIONS:
			return "Only mentions";
		case GuildNotificationLevel.NOTHING:
			return "Nothing";
		case ChannelNotificationLevel.PARENT_DEFAULT:
			return "Category default";
		default:
			throw new Error("Unknown notification level");
	}
}

const [frecencySettings, setFrecencySettings] = createStore<FrecencyUserSettings>({});
const [preloadedSettings, setPreloadedSettings] = createStore<PreloadedUserSettings>({});
const [userGuildSettings, setUserGuildSettings] = createStore<{
	[guild_id: string]: DistributiveOmit<Output<typeof guild_settings_entry>, "guild_id" | "channel_overrides"> & {
		overriden_channel_ids?: string[];
	};
}>({});
// this also belongs to the userGuildSettings, just pulled it out for easier access
const [channelOverrides, setChannelOverrides] = createStore<{
	[channel_id: string]: DistributiveOmit<Output<typeof channel_override>, "channel_id">;
}>({});
const [userGuildSettingsVersion, setUserGuildSettingsVersion] = createSignal<number>(0);

const muteTimers = new Map<string, NodeJS.Timeout>();
function registerTimedChannelMute(channelId: string, config: { end_time: string | null; selected_time_window: number }): void {
	if (muteTimers.has(channelId)) clearTimeout(muteTimers.get(channelId)!);
	if (!config.end_time) return; // TODO: uh?

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
	if (!config.end_time) return; // TODO: uh?

	const end = new Date(config.end_time).getTime();
	const now = Date.now();
	if (end < now) return;

	const timer = setTimeout(() => {
		setUserGuildSettings(guildId, "muted", false);
	}, end - now);
	muteTimers.set(guildId, timer);
}

const channelOverrideDefaults: DistributiveOmit<Output<typeof channel_override>, "channel_id"> = {
	collapsed: false,
	message_notifications: ChannelNotificationLevel.PARENT_DEFAULT,
	mute_config: null,
	muted: false,
};

const guildSettingsDefaults: DistributiveOmit<Output<typeof guild_settings_entry>, "guild_id" | "channel_overrides"> = {
	flags: 0,
	hide_muted_channels: false,
	message_notifications: GuildNotificationLevel.ONLY_MENTIONS,
	mobile_push: true,
	mute_config: null,
	mute_scheduled_events: false,
	muted: false,
	notify_highlights: 0,
	suppress_everyone: false,
	suppress_roles: false,
	version: 0,
};

// thanks SO https://stackoverflow.com/a/21797381
function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export default new (class SettingsStore extends Store {
	constructor() {
		super({
			// await connect to make sure token is valid trolley
			GATEWAY_CONNECT: () => {
				// TODO: fetch frecency settings from https://discord.com/api/v9/users/@me/settings-proto/2
			},
			READY: ({ user_settings_proto, user_guild_settings }) => {
				batch(() => {
					setPreloadedSettings(PreloadedUserSettings.fromBinary(base64ToUint8Array(user_settings_proto)));

					if (!user_guild_settings) return;
					if (user_guild_settings.partial) throw new Error("Partial updates are not supported");

					setUserGuildSettingsVersion(user_guild_settings.version);
					for (const entry of user_guild_settings.entries ?? []) {
						const { guild_id, channel_overrides, ...rest } = entry;
						setUserGuildSettings(guild_id, rest);
						if (channel_overrides)
							setUserGuildSettings(
								guild_id,
								"overriden_channel_ids",
								channel_overrides.map((o) => o.channel_id),
							);
						if (entry.mute_config && entry.muted) registerTimedGuildMute(guild_id, entry.mute_config);

						for (const override of channel_overrides ?? []) {
							const { channel_id, ...rest } = override;
							setChannelOverrides(channel_id, rest);
							if (override.mute_config && override.muted) registerTimedChannelMute(channel_id, override.mute_config);
						}
					}
				});
			},
			USER_GUILD_SETTINGS_UPDATE: ({ guild_id, channel_overrides, ...rest }) => {
				const lastVersion = userGuildSettings[guild_id];
				if (lastVersion) {
					for (const o of lastVersion.overriden_channel_ids ?? []) {
						if (muteTimers.has(o)) clearTimeout(muteTimers.get(o)!);
					}
					setChannelOverrides(
						produce((p) => {
							for (const o of lastVersion.overriden_channel_ids ?? []) {
								delete p[o];
							}
						}),
					);
				}

				setUserGuildSettings(guild_id, rest);
				if (rest.mute_config && rest.muted) registerTimedGuildMute(guild_id, rest.mute_config);

				for (const override of channel_overrides ?? []) {
					const { channel_id, ...rest } = override;
					setChannelOverrides(channel_id, rest);
					if (override.mute_config && override.muted) registerTimedChannelMute(channel_id, override.mute_config);
				}

				setUserGuildSettingsVersion(rest.version);
			},
			USER_SETTINGS_PROTO_UPDATE: ({ partial, settings }) => {
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
			},
		});
	}

	preloadedSettings = preloadedSettings;
	frecencySettings = frecencySettings;
	userGuildSettings = userGuildSettings;
	channelOverrides = channelOverrides;

	// eslint-disable-next-line solid/reactivity
	getChannelNotificationLevel(channelId: string): ChannelNotificationLevel {
		const ch = channelOverrides[channelId];
		if (!ch) return ChannelNotificationLevel.PARENT_DEFAULT;
		return ch.message_notifications;
	}

	// eslint-disable-next-line solid/reactivity
	getGuildNotificationLevel(guildId: string): GuildNotificationLevel {
		const guild = userGuildSettings[guildId];
		if (!guild) return guildSettingsDefaults.message_notifications;
		return guild.message_notifications;
	}

	// eslint-disable-next-line solid/reactivity
	resolveChannelNotificationLevel(channelId: string, guildId: string, parentChannelId?: string): ChannelNotificationLevel {
		const ch = ChannelStore.getGuildChannel(channelId);
		if (!ch) throw new Error("Unknown channel");
		const override = channelOverrides[channelId];

		if (override && override.message_notifications !== ChannelNotificationLevel.PARENT_DEFAULT) return override.message_notifications;
		if (parentChannelId) return this.resolveChannelNotificationLevel(parentChannelId, guildId);

		return this.getGuildNotificationLevel(guildId) as any as ChannelNotificationLevel;
	}

	toggleCollapsed(channelId: string): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, channelOverrideDefaults);
		setChannelOverrides(
			channelId,
			"collapsed",
			untrack(() => !ch?.collapsed),
		);

		// TODO: send update to discord
	}

	muteChannel(channelId: string, seconds?: number): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, channelOverrideDefaults);
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
		if (!guild) setUserGuildSettings(guildId, guildSettingsDefaults);
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
		if (!guild) setUserGuildSettings(guildId, guildSettingsDefaults);
		setUserGuildSettings(
			guildId,
			"hide_muted_channels",
			untrack(() => !guild?.hide_muted_channels),
		);
	}

	setChannelNotificationLevel(channelId: string, level: ChannelNotificationLevel): void {
		const ch = untrack(() => channelOverrides[channelId]);
		if (!ch) setChannelOverrides(channelId, channelOverrideDefaults);
		setChannelOverrides(channelId, "message_notifications", level);
	}
})();
