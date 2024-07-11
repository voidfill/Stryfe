import { any, array, boolean, literal, nullable, number, object, optional, picklist, record, string, union, unknown } from "valibot";

import { guild_channel } from "../channels";
import { user } from "../common";
import { mute_config } from "../settings";
import { thread } from "../thread";
import emoji from "./emoji";
import guild_member from "./member";
import role from "./role";
import sticker from "./sticker";
import voice_state from "./voicestate";

const application_command_counts = record(string(), number());

export const ready_guild_properties = object({
	afk_channel_id: nullable(string()),
	afk_timeout: number(),
	application_id: nullable(string()),
	banner: nullable(string()),
	clan: nullable(unknown()),
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
	activity_instances: unknown(),
	application_command_counts: application_command_counts,
	channels: array(guild_channel),
	data_mode: picklist(["full", "partial"]),
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
	threads: nullable(
		array(
			object({
				...thread.entries,
				last_message_id: nullable(string()),
				last_pin_timestamp: optional(nullable(string())),
				member: optional(
					object({
						flags: number(),
						join_timestamp: string(),
						mute_config: nullable(mute_config),
						muted: boolean(),
					}),
				),
				member_count: number(),
				member_ids_preview: array(string()),
				message_count: number(),
				total_message_sent: number(),
			}),
		),
	),
	unavailable: optional(literal(false)), // This property does not exist, but its very useful for type-narrowing
	version: string(),
});

export const unavailable_guild = object({
	id: string(),
	unavailable: literal(true),
});

export const GUILD_CREATE = union([
	object({
		...ready_guild.entries,
		embedded_activities: nullable(unknown()),
		members: nullable(array(guild_member)),
		presences: nullable(array(unknown())),
		voice_states: nullable(array(voice_state)),
	}),
	unavailable_guild,
]);

export const GUILD_UPDATE = object({
	...ready_guild_properties.entries,
	id: string(),
});

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
	changes: optional(nullable(array(object({ key: string(), new_value: any(), old_value: any() })))),
	guild_id: string(),
	id: string(),
	target_id: nullable(string()),
	user_id: string(),
});

export const GUILD_SCHEDULED_EVENT_USER_ADD = object({
	guild_id: string(),
	guild_scheduled_event_exception_id: optional(string()),
	guild_scheduled_event_id: string(),
	response: number(),
	user_id: string(),
});

export const GUILD_SCHEDULED_EVENT_USER_REMOVE = GUILD_SCHEDULED_EVENT_USER_ADD;

export const GUILD_BAN_ADD = object({
	guild_id: string(),
	user: user,
});
