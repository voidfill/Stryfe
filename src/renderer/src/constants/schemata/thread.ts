import { array, boolean, merge, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "../channel";
import { equalArray } from "./common";
import member from "./guild/member";
import { genericMessage } from "./message";
import { PRESENCE_UPDATE } from "./presence";
import { mute_config } from "./settings";

export const thread = object({
	applied_tags: optional(array(string())),
	flags: number(),
	id: string(),
	name: string(),
	owner_id: string(),
	parent_id: string(),
	rate_limit_per_user: number(),
	thread_metadata: object({
		archive_timestamp: string(),
		archived: boolean(),
		auto_archive_duration: number(),
		create_timestamp: optional(nullable(string())),
		invitable: optional(boolean()),
		locked: boolean(),
	}),
	type: equalArray([ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD, ChannelTypes.ANNOUNCEMENT_THREAD] as const),
});

export const THREAD_CREATE = merge([
	thread,
	object({
		guild_id: string(),
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
		member_ids_preview: array(string()),
		newly_created: optional(boolean()),
	}),
]);

export const THREAD_UPDATE = THREAD_CREATE;

export const THREAD_DELETE = object({
	guild_id: string(),
	id: string(),
	parent_id: string(),
	type: equalArray([ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD, ChannelTypes.ANNOUNCEMENT_THREAD] as const),
});

export const THREAD_MEMBER_UPDATE = object({
	flags: number(),
	guild_id: string(),
	id: string(),
	join_timestamp: string(),
	mute_config: nullable(mute_config),
	muted: boolean(),
	user_id: string(),
});

export const THREAD_LIST_SYNC = object({
	guild_id: string(),
	most_recent_messages: nullable(array(merge([genericMessage, object({ referenced_message: optional(nullable(genericMessage)) })]))),
	threads: nullable(array(thread)),
});

export const THREAD_MEMBERS_UPDATE = object({
	added_members: optional(
		array(
			object({
				flags: number(),
				id: string(),
				join_timestamp: string(),
				member: member,
				presence: nullable(PRESENCE_UPDATE),
				user_id: string(),
			}),
		),
	),
	guild_id: string(),
	id: string(),
	member_count: number(),
	member_ids_preview: optional(array(string())),
	removed_member_ids: optional(array(string())),
});
