import { any, array, boolean, nullable, number, object, omit, optional, strictObject, string, tuple, union, unknown } from "valibot";

import { private_channel } from "../channels";
import { status, user, user_self } from "../common";
import { ready_guild, unavailable_guild } from "../guild";
import guild_member from "../guild/member";
import voice_state from "../guild/voicestate";
import { activity, client_status } from "../presence";
import { read_state_entry } from "../readstate";
import { relationship } from "../relationship";
import { guild_settings_entry } from "../settings";
import connected_account from "./connectedaccount";
import { session } from "./session";

export const merged_member = object({
	...omit(guild_member, ["user"]).entries,
	unusual_dm_activity_until: optional(nullable(string())),
	user_id: string(),
});

export const READY = object({
	_trace: array(string()),
	analytics_token: string(),
	api_code_version: number(),
	auth: unknown(),
	auth_session_id_hash: string(),
	connected_accounts: nullable(array(connected_account)),
	consents: any(),
	country_code: string(),
	experiments: any(),
	explicit_content_scan_version: number(),
	friend_suggestion_count: number(),
	geo_ordered_rtc_regions: array(string()),
	guild_experiments: any(),
	guild_join_requests: nullable(array(unknown())),
	guilds: nullable(array(union([unavailable_guild, ready_guild]))),
	merged_members: nullable(array(nullable(tuple([merged_member])))),
	notification_settings: unknown(),
	private_channels: nullable(array(private_channel)),
	read_state: object({
		entries: nullable(array(read_state_entry)),
		partial: boolean(),
		version: number(),
	}),
	relationships: nullable(array(relationship)),
	resume_gateway_url: string(),
	session_id: string(),
	session_type: string(),
	sessions: array(session),
	static_client_session_id: string(),
	tutorial: any(),
	user: user_self,
	user_guild_settings: nullable(
		object({
			entries: nullable(array(guild_settings_entry)),
			partial: boolean(),
			version: number(),
		}),
	),
	user_settings_proto: string(),
	users: nullable(array(user)),
	v: number(),
});

export const READY_SUPPLEMENTAL = object({
	disclose: array(string()),
	game_invites: any(),
	guilds: nullable(
		array(
			object({
				embedded_activities: optional(nullable(unknown())),
				id: string(),
				voice_states: optional(nullable(array(voice_state))),
			}),
		),
	),
	lazy_private_channels: unknown(),
	merged_members: nullable(array(nullable(array(merged_member)))),
	merged_presences: nullable(
		object({
			friends: nullable(
				array(
					object({
						activities: nullable(array(activity)),
						client_status: client_status,
						status: status,
						user_id: string(),
					}),
				),
			),
			guilds: nullable(
				array(
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
			),
		}),
	),
});

// not received with current capabilities
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

export const PASSIVE_UPDATE_V2 = strictObject({
	guild_id: string(),
	removed_voice_states: optional(nullable(array(string()))),
	updated_channels: PASSIVE_UPDATE_V1.entries.channels,
	updated_members: PASSIVE_UPDATE_V1.entries.members,
	updated_voice_states: PASSIVE_UPDATE_V1.entries.voice_states,
});

export const RESUMED = object({
	_trace: array(string()),
});

export const USER_UPDATE = user_self;
