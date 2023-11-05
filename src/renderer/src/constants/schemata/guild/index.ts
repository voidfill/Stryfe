import { guild_channel } from "../channels";
import { equal, equalArray } from "../common";
import emoji from "./emoji";
import guild_member from "./member";
import role from "./role";
import sticker from "./sticker";
import voice_state from "./voicestate";

import { any, array, boolean, merge, nullable, number, object, optional, record, string, unknown } from "valibot";

const application_command_counts = record(number());

export const ready_guild_properties = object({
	afk_channel_id: nullable(string()),
	afk_timeout: number(),
	application_id: nullable(string()),
	banner: nullable(string()),
	default_message_notifications: number(),
	description: nullable(string()),
	discovery_splash: nullable(unknown()),
	explicit_content_filter: number(),
	features: nullable(array(string())),
	home_header: nullable(unknown()),
	hub_type: nullable(unknown()),
	icon: nullable(string()),
	id: string(),
	incidents_data: nullable(unknown()),
	inventory_settings: nullable(unknown()),
	latest_onboarding_question_id: nullable(unknown()),
	max_members: number(),
	max_stage_video_channel_users: number(),
	max_video_channel_users: number(),
	mfa_level: number(),
	name: string(),
	nsfw: boolean(),
	nsfw_level: number(),
	owner_id: string(),
	preferred_locale: string(),
	premium_progress_bar_enabled: boolean(),
	premium_tier: number(),
	public_updates_channel_id: nullable(string()),
	rules_channel_id: nullable(string()),
	safety_alerts_channel_id: nullable(string()),
	splash: nullable(unknown()),
	system_channel_flags: number(),
	system_channel_id: nullable(string()),
	vanity_url_code: nullable(string()),
	verification_level: number(),
});

export const ready_guild = object({
	application_command_counts: application_command_counts,
	channels: array(guild_channel),
	data_mode: equalArray(["full", "partial"] as const),
	emojis: nullable(array(emoji)),
	guild_scheduled_events: nullable(array(unknown())),
	id: string(),
	joined_at: string(),
	large: boolean(),
	lazy: boolean(),
	member_count: number(),
	premium_subscription_count: number(),
	properties: ready_guild_properties,
	roles: array(role),
	stage_instances: nullable(array(unknown())),
	stickers: nullable(array(sticker)),
	threads: nullable(array(unknown())),
	unavailable: optional(equal(false)), // This property does not exist, but its very useful for type-narrowing
	version: string(),
});

export const unavailable_guild = object({
	id: string(),
	unavailable: equal(true),
});

export const GUILD_CREATE = merge([
	ready_guild,
	object({
		embedded_activities: nullable(unknown()),
		members: nullable(array(guild_member)),
		presences: nullable(array(unknown())),
		voice_states: nullable(array(voice_state)),
	}),
]);

export const GUILD_UPDATE = merge([
	ready_guild_properties,
	object({
		id: string(),
	}),
]);

export const GUILD_DELETE = object({
	id: string(),
	unavailable: optional(boolean()),
});

export const GUILD_APPLICATION_COMMAND_INDEX_UPDATE = object({
	application_command_counts: application_command_counts,
	bot_users: nullable(unknown()),
	guild_id: string(),
	version: string(),
});

export const GUILD_AUDIT_LOG_ENTRY_CREATE = object({
	action_type: number(),
	changes: nullable(array(object({ key: string(), new_value: any(), old_value: any() }))),
	guild_id: string(),
	id: string(),
	target_id: string(),
	user_id: string(),
});
