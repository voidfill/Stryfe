import { ChannelTypes } from "./channel";
import { discriminatedUnion } from "./discriminatedUnion";
import { PlatformTypes } from "./user";

import {
	any,
	array,
	boolean,
	merge,
	nullable,
	nullType,
	number,
	object,
	omit,
	optional,
	record,
	special,
	SpecialSchema,
	string,
	StringSchema,
	tuple,
	union,
	unknown,
} from "valibot";

export function equal<T extends number | string | boolean>(v: T): SpecialSchema<T> {
	return special((a) => a === v);
}
export function equalArray<T extends readonly (number | string | boolean)[]>(v: T): SpecialSchema<T[number]> {
	return special((a) => v.some((b) => a === b));
}

// any => wont be type checked
// unknown => TODO

export const user = object({
	avatar: nullable(string()),
	avatar_decoration_data: nullable(
		object({
			asset: string(),
			sku_id: string(),
		}),
	),
	bot: optional(boolean()),
	discriminator: string(),
	display_name: optional(nullable(string())),
	global_name: nullable(string()),
	id: string(),
	public_flags: number(),
	username: string(),
});

const application_command_counts = record(number());

export const status = equalArray(["online", "idle", "dnd", "offline", "invisible", "unknown"] as const);

export const client_status = object({
	desktop: optional(status),
	mobile: optional(status),
	web: optional(status),
});

export enum ActivityTypes {
	PLAYING,
	STREAMING,
	LISTENING,
	WATCHING,
	CUSTOM,
	COMPETING,
}
export const activity_type = special<ActivityTypes>((v) => typeof v === "number" && v >= 0 && v <= 5);
export const activity = object({
	application_id: optional(string()),
	assets: optional(
		object({
			large_image: optional(string()),
			large_text: optional(string()),
			small_image: optional(string()),
			small_text: optional(string()),
		}),
	),
	buttons: optional(
		union([
			array(
				object({
					label: string(),
					url: string(),
				}),
			),
			array(string()),
		]),
	),
	created_at: string(),
	details: optional(string()),
	emoji: optional(
		nullable(
			object({
				animated: optional(boolean()),
				id: optional(string()),
				name: string(),
			}),
		),
	),
	flags: optional(number()),
	id: string(),
	instance: optional(boolean()),
	name: string(),
	party: optional(
		object({
			id: string(),
			size: optional(unknown()),
		}),
	),
	secrets: optional(
		object({
			join: optional(string()),
			match: optional(string()),
			spectate: optional(string()),
		}),
	),
	session_id: optional(string()),
	state: optional(nullable(string())),
	sync_id: optional(string()),
	timestamps: optional(
		object({
			end: optional(string()),
			start: optional(string()),
		}),
	),
	type: activity_type,
	url: unknown(),
});

export const session = object({
	activities: nullable(array(activity)),
	client_info: object({
		client: string(),
		os: string(),
		version: number(),
	}),
	session_id: string(),
	status: status,
});

export const voice_state = object({
	channel_id: string(),
	deaf: boolean(),
	mute: boolean(),
	request_to_speak_timestamp: nullable(string()),
	self_deaf: boolean(),
	self_mute: boolean(),
	self_video: boolean(),
	session_id: string(),
	suppress: boolean(),
	user_id: string(),
});

export const role = object({
	color: number(),
	flags: number(),
	hoist: boolean(),
	icon: nullable(string()),
	id: string(),
	managed: boolean(),
	mentionable: boolean(),
	name: string(),
	permissions: string(),
	position: number(),
	tags: union([
		object({}),
		object({
			bot_id: string(),
		}),
	]),
	unicode_emoji: nullable(string()),
});

export const sticker = object({
	asset: union([string(), unknown()]),
	available: boolean(),
	description: nullable(string()),
	format_type: number(),
	guild_id: string(),
	id: string(),
	name: string(),
	tags: string(),
	type: number(),
});

export const emoji = object({
	animated: boolean(),
	available: boolean(),
	id: string(),
	managed: boolean(),
	name: string(),
	require_colons: boolean(),
	roles: nullable(array(string())),
});

export const guild_member = object({
	avatar: nullable(string()),
	communication_disabled_until: nullable(string()),
	deaf: boolean(),
	flags: number(),
	joined_at: string(),
	mute: boolean(),
	nick: nullable(string()),
	pending: boolean(),
	premium_since: nullable(string()),
	roles: nullable(array(string())),
	user: user,
});

export const merged_member = merge([
	omit(guild_member, ["user"]),
	object({
		user_id: string(),
	}),
]);

export const relationship = object({
	id: string(),
	nickname: nullable(string()),
	since: optional(string()),
	type: number(),
});

const platformType = special<PlatformTypes>((v) => {
	if (typeof v !== "string") return false;
	return Object.values(PlatformTypes).includes(v as PlatformTypes);
});

export const connected_account = object({
	access_token: optional(string()),
	friend_sync: boolean(),
	id: string(),
	metadata_visibility: number(),
	name: string(),
	revoked: boolean(),
	show_activity: boolean(),
	two_way_link: boolean(),
	type: platformType,
	verified: boolean(),
	visibility: number(),
});

export const unavailable_guild = object({
	id: string(),
	unavailable: equal(true),
});

export const permission_overwrite = object({
	allow: string(),
	deny: string(),
	id: string(),
	type: equalArray([0, 1] as const),
});

export const channel_direct_message = object({
	flags: number(),
	id: string(),
	is_spam: boolean(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	recipient_ids: tuple([string()]),
	type: equal(ChannelTypes.DM),
});

export const channel_group_direct_message = object({
	flags: number(),
	icon: nullable(string()),
	id: string(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: nullable(string()),
	owner_id: string(),
	recipient_ids: array(string()),
	type: equal(ChannelTypes.GROUP_DM),
});

export const channel_private = discriminatedUnion("type", [channel_direct_message, channel_group_direct_message]);

export const channel_text = object({
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	id: string(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_TEXT),
});

export const channel_voice = object({
	bitrate: number(),
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	id: string(),
	last_message_id: nullable(string()),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rtc_region: nullable(string()),
	theme_color: optional(nullable(number())),
	type: equal(ChannelTypes.GUILD_VOICE),
	user_limit: number(),
});
export const channel_stage_voice = merge([
	omit(channel_voice, ["type"]),
	object({
		type: equal(ChannelTypes.GUILD_STAGE_VOICE),
	}),
]);

export const channel_category = object({
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	id: string(),
	name: string(),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	theme_color: optional(nullable(number())),
	type: equal(ChannelTypes.GUILD_CATEGORY),
});

export const channel_announcement = object({
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	id: string(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_ANNOUNCEMENT),
});

export const channel_directory = object({
	TODO: unknown(),
	type: equal(ChannelTypes.GUILD_DIRECTORY),
});

export const channel_forum = object({
	available_tags: nullable(array(unknown())),
	default_auto_archive_duration: optional(number()),
	default_forum_layout: optional(number()),
	default_reaction_emoji: optional(
		nullable(
			object({
				emoji_id: nullable(string()),
				emoji_name: nullable(string()),
			}),
		),
	),
	default_sort_order: optional(nullable(equalArray([0, 1] as const))),
	default_thread_rate_limit_per_user: optional(number()),
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	last_message_id: nullable(string()),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	template: string(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_FORUM),
});

export const channel_media_forum = merge([
	omit(channel_forum, ["type"]),
	object({
		type: equal(ChannelTypes.GUILD_MEDIA),
	}),
]);

export const channel_guild = discriminatedUnion("type", [
	channel_text,
	channel_voice,
	channel_stage_voice,
	channel_category,
	channel_announcement,
	channel_directory,
	channel_forum,
	channel_media_forum,
]);

const _guild_id = object({
	guild_id: string(),
});
const _channel_guild_guild_id = discriminatedUnion("type", [
	merge([channel_text, _guild_id]),
	merge([channel_voice, _guild_id]),
	merge([channel_stage_voice, _guild_id]),
	merge([channel_category, _guild_id]),
	merge([channel_announcement, _guild_id]),
	merge([channel_directory, _guild_id]),
	merge([channel_forum, _guild_id]),
	merge([channel_media_forum, _guild_id]),
]);
const hashes = object({
	channels: object({
		hash: string(),
	}),
	metadata: object({
		hash: string(),
	}),
	roles: object({
		hash: string(),
	}),
});
const _guildCHHashes = object({
	guild_hashes: hashes,
	guild_id: string(),
	hashes: hashes,
});
const _channel_guild_hashes = discriminatedUnion("type", [
	merge([channel_text, _guildCHHashes]),
	merge([channel_voice, _guildCHHashes]),
	merge([channel_stage_voice, _guildCHHashes]),
	merge([channel_category, _guildCHHashes]),
	merge([channel_announcement, _guildCHHashes]),
	merge([channel_directory, _guildCHHashes]),
	merge([channel_forum, _guildCHHashes]),
	merge([channel_media_forum, _guildCHHashes]),
]);

export const ready_guild = object({
	application_command_counts: application_command_counts,
	channels: array(channel_guild),
	data_mode: equalArray(["full", "partial"] as const),
	emojis: nullable(array(emoji)),
	guild_scheduled_events: nullable(array(unknown())),
	id: string(),
	joined_at: string(),
	large: boolean(),
	lazy: boolean(),
	member_count: number(),
	premium_subscription_count: number(),
	properties: object({
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
	}),
	roles: array(role),
	stage_instances: nullable(array(unknown())),
	stickers: nullable(array(sticker)),
	threads: nullable(array(unknown())),
	// unavailable: optional(falseSchema), TODO: check whether its needed
	version: string(),
});

// ------------- //

export const READY = object({
	_trace: array(string()),
	analytics_token: string(),
	api_code_version: number(),
	auth_session_id_hash: string(),
	connected_accounts: array(connected_account),
	consents: any(),
	country_code: string(),
	experiments: any(),
	friend_suggestion_count: number(),
	geo_ordered_rtc_regions: array(string()),
	guild_experiments: any(),
	guild_join_requests: nullable(array(unknown())),
	guilds: array(union([unavailable_guild, ready_guild])),
	merged_members: array(tuple([merged_member])),
	private_channels: array(channel_private),
	read_state: object({
		entries: array(
			union([
				object({
					flags: number(),
					id: string(),
					last_message_id: union([equal(0), string()]),
					last_pin_timestamp: string(),
					mention_count: number(),
				}),
				object({
					badge_count: number(),
					id: string(),
					last_acked_id: string(),
					read_state_type: number(),
				}),
			]),
		),
		partial: boolean(),
		version: number(),
	}),
	relationships: array(relationship),
	resume_gateway_url: string(),
	session_id: string(),
	session_type: string(),
	sessions: array(session),
	tutorial: any(),
	user: unknown(),
	user_guild_settings: unknown(),
	user_settings_proto: string(),
	users: array(user),
	v: number(),
});

export const READY_SUPPLEMENTAL = object({
	disclose: array(string()),
	game_invites: any(),
	guilds: array(
		object({
			embedded_activities: nullable(unknown()),
			id: string(),
			voice_states: nullable(array(voice_state)),
		}),
	),
	lazy_private_channels: unknown(),
	merged_members: array(nullable(array(merged_member))),
	merged_presences: object({
		friends: array(
			object({
				activities: nullable(array(activity)),
				client_status: client_status,
				status: status,
				user_id: string(),
			}),
		),
		guilds: array(
			nullable(
				array(
					object({
						activities: nullable(array(activity)),
						broadcast: nullable(unknown()),
						client_status: client_status,
						status: status,
						user_id: string(),
					}),
				),
			),
		),
	}),
});

export const PASSIVE_UPDATE_V1 = object({
	channels: optional(
		nullable(
			array(
				object({
					id: string(),
					last_message_id: string(),
					last_pin_timestamp: optional(nullable(string())),
				}),
			),
		),
	),
	guild_id: string(),
	members: optional(nullable(array(guild_member))),
	voice_states: optional(nullable(array(voice_state))),
});

export const PRESENCE_UPDATE = object({
	activities: nullable(array(activity)),
	broadcast: nullable(unknown()),
	client_status: client_status,
	guild_id: optional(string()),
	status: status,
	user: union([
		user,
		object({
			id: string(),
		}),
	]),
});

export const SESSIONS_REPLACE = array(session);

export const CHANNEL_UPDATE = union([channel_private, _channel_guild_guild_id]);

export const CHANNEL_CREATE = union([channel_private, _channel_guild_guild_id]);

export const CHANNEL_DELETE = union([channel_private, _channel_guild_hashes]);

export const GUILD_AUDIT_LOG_ENTRY_CREATE = object({
	action_type: number(),
	changes: nullable(array(object({ key: string(), new_value: any(), old_value: any() }))),
	guild_id: string(),
	id: string(),
	target_id: string(),
	user_id: string(),
});

export const CHANNEL_PINS_UPDATE = object({
	channel_id: string(),
	guild_id: optional(string()),
	last_pin_timestamp: nullable(string()),
});

export const CHANNEL_RECIPIENT_ADD = object({
	channel_id: string(),
	user: user,
});

export const CHANNEL_RECIPIENT_REMOVE = object({
	channel_id: string(),
	user: user,
});

export const MESSAGE_ACK = union([
	object({
		ack_type: number(),
		channel_id: string(),
		flags: nullable(number()),
		last_viewed: nullType(),
		manual: equal(true),
		mention_count: number(),
		message_id: string(),
		version: number(),
	}),
	object({
		channel_id: string(),
		flags: nullable(number()),
		last_viewed: number(),
		message_id: string(),
		version: number(),
	}),
]);

export const TYPING_START = object({
	channel_id: string(),
	guild_id: optional(string()),
	member: optional(guild_member),
	timestamp: number(),
	user_id: string(),
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

export const GUILD_DELETE = object({
	id: string(),
	unavailable: optional(boolean()),
});

export const GUILD_APPLICATION_INDEX_UPDATE = object({
	application_command_counts: application_command_counts,
	guild_hashes: hashes,
	guild_id: string(),
	hashes: hashes,
	version: string(),
});

export const MESSAGE_REACTION_ADD = object({
	burst: boolean(),
	channel_id: string(),
	emoji: object({
		animated: optional(boolean()),
		id: nullable(string()),
		name: string(),
	}),
	guild_id: optional(string()),
	member: optional(guild_member),
	message_author_id: string(),
	message_id: string(),
	type: number(),
	user_id: string(),
});

export const MESSAGE_REACTION_REMOVE = object({
	burst: boolean(),
	channel_id: string(),
	emoji: object({
		animated: optional(boolean()),
		id: nullable(string()),
		name: string(),
	}),
	guild_id: optional(string()),
	type: number(),
	user_id: string(),
});

export const RELATIONSHIP_ADD = merge([
	relationship,
	object({
		should_notify: boolean(),
		user: user,
	}),
]);

export const RELATIONSHIP_REMOVE = relationship;

export const __allDispatches = {
	CHANNEL_CREATE,
	CHANNEL_DELETE,
	CHANNEL_PINS_UPDATE,
	CHANNEL_RECIPIENT_ADD,
	CHANNEL_RECIPIENT_REMOVE,
	CHANNEL_UPDATE,
	GUILD_APPLICATION_INDEX_UPDATE,
	GUILD_AUDIT_LOG_ENTRY_CREATE,
	GUILD_CREATE,
	GUILD_DELETE,
	MESSAGE_ACK,
	MESSAGE_REACTION_ADD,
	MESSAGE_REACTION_REMOVE,
	PASSIVE_UPDATE_V1,
	PRESENCE_UPDATE,
	READY,
	READY_SUPPLEMENTAL,
	RELATIONSHIP_ADD,
	RELATIONSHIP_REMOVE,
	SESSIONS_REPLACE,
	TYPING_START,
};
