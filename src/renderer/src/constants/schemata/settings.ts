import { array, boolean, nullable, number, object, optional, picklist, string } from "valibot";

export const enum UserSettingsType {
	PRELOADED_USER_SETTINGS = 1,
	FRECENCY_AND_FAVORITES_SETTINGS = 2,
	TEST_SETTINGS = 3, // explode
}

export const enum NotificationLevel {
	ALL_MESSAGES = 0,
	ONLY_MENTIONS = 1,
	NOTHING = 2,
	PARENT_DEFAULT = 3,
}

export const enum HighlightLevel {
	DEFAULT = 0,
	DISABLED = 1,
	ENABLED = 2,
}
const nl = picklist([NotificationLevel.ALL_MESSAGES, NotificationLevel.ONLY_MENTIONS, NotificationLevel.NOTHING, NotificationLevel.PARENT_DEFAULT]);

export const mute_config = object({
	end_time: nullable(string()),
	selected_time_window: number(),
});

export const channel_override = object({
	channel_id: string(),
	collapsed: boolean(),
	flags: optional(number()),
	message_notifications: nl,
	mute_config: nullable(mute_config),
	muted: boolean(),
});

export const guild_settings_entry = object({
	channel_overrides: nullable(array(channel_override)),
	flags: number(),
	guild_id: nullable(string()),
	hide_muted_channels: boolean(),
	message_notifications: nl,
	mobile_push: boolean(),
	mute_config: nullable(mute_config),
	mute_scheduled_events: boolean(),
	muted: boolean(),
	notify_highlights: picklist([HighlightLevel.DEFAULT, HighlightLevel.DISABLED, HighlightLevel.ENABLED]),
	suppress_everyone: boolean(),
	suppress_roles: boolean(),
	version: number(),
});

export const USER_SETTINGS_PROTO_UPDATE = object({
	partial: boolean(),
	settings: object({
		proto: string(),
		type: picklist([UserSettingsType.FRECENCY_AND_FAVORITES_SETTINGS, UserSettingsType.PRELOADED_USER_SETTINGS, UserSettingsType.TEST_SETTINGS]),
	}),
});

export const USER_GUILD_SETTINGS_UPDATE = guild_settings_entry;
