import { equalArray } from "./common";

import { NotificationLevel, UserSettingsType } from "@renderer/stores/settings";
import { array, boolean, nullable, number, object, string } from "valibot";

const nl = equalArray([NotificationLevel.ALL_MESSAGES, NotificationLevel.ONLY_MENTIONS, NotificationLevel.NOTHING, NotificationLevel.PARENT_DEFAULT]);

const mute_config = object({
	end_time: nullable(string()),
	selected_time_window: number(),
});

export const channel_override = object({
	channel_id: string(),
	collapsed: boolean(),
	message_notifications: nl,
	mute_config: nullable(mute_config),
	muted: boolean(),
});

export const guild_settings_entry = object({
	channel_overrides: nullable(array(channel_override)),
	flags: number(),
	guild_id: string(),
	hide_muted_channels: boolean(),
	message_notifications: nl,
	mobile_push: boolean(),
	mute_config: nullable(mute_config),
	mute_scheduled_events: boolean(),
	muted: boolean(),
	notify_highlights: number(),
	suppress_everyone: boolean(),
	suppress_roles: boolean(),
	version: number(),
});

export const USER_SETTINGS_PROTO_UPDATE = object({
	partial: boolean(),
	settings: object({
		proto: string(),
		type: equalArray([
			UserSettingsType.FRECENCY_AND_FAVORITES_SETTINGS,
			UserSettingsType.PRELOADED_USER_SETTINGS,
			UserSettingsType.TEST_SETTINGS,
		] as const),
	}),
});

export const USER_GUILD_SETTINGS_UPDATE = guild_settings_entry;
