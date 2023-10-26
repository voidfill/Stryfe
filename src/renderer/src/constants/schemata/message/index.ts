import { equal } from "../common";
import guild_member from "../guild/member";

import { boolean, nullable, nullType, number, object, optional, string, union } from "valibot";

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
