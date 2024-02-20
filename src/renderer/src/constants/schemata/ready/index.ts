import { private_channel } from "../channels";
import { equal, status, user, user_self } from "../common";
import { ready_guild, unavailable_guild } from "../guild";
import guild_member from "../guild/member";
import voice_state from "../guild/voicestate";
import { activity, client_status } from "../presence";
import { relationship } from "../relationship";
import { guild_settings_entry } from "../settings";
import connected_account from "./connectedaccount";
import { session } from "./session";

import { any, array, boolean, merge, nullable, number, object, omit, optional, string, tuple, union, unknown } from "valibot";

const merged_member = merge([
	omit(guild_member, ["user"]),
	object({
		user_id: string(),
	}),
]);

export const READY = object({
	_trace: array(string()),
	analytics_token: string(),
	api_code_version: number(),
	auth_session_id_hash: string(),
	connected_accounts: nullable(array(connected_account)),
	consents: any(),
	country_code: string(),
	experiments: any(),
	friend_suggestion_count: number(),
	geo_ordered_rtc_regions: array(string()),
	guild_experiments: any(),
	guild_join_requests: nullable(array(unknown())),
	guilds: nullable(array(union([unavailable_guild, ready_guild]))),
	merged_members: nullable(array(nullable(tuple([merged_member])))),
	private_channels: array(private_channel),
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
	user: user_self,
	user_guild_settings: nullable(
		object({
			entries: array(guild_settings_entry),
			partial: boolean(),
			version: number(),
		}),
	),
	user_settings_proto: string(),
	users: array(user),
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
	),
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

export const RESUMED = object({
	keythatdoesntexist: equal("TODO: fix"),
});
