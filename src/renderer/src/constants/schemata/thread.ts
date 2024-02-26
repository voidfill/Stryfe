import { ChannelTypes } from "../channel";
import { equalArray } from "./common";
import { mute_config } from "./settings";

import { array, boolean, merge, nullable, number, object, optional, string } from "valibot";

export const thread = object({
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
		create_timestamp: optional(string()),
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
