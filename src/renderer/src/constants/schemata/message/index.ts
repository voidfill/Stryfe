import guild_member from "../guild/member";

import { boolean, nullable, number, object, optional, string } from "valibot";

export const MESSAGE_ACK = object({
	ack_type: optional(number()),
	channel_id: string(),
	flags: nullable(number()),
	last_viewed: nullable(number()),
	manual: optional(boolean()),
	mention_count: optional(number()),
	message_id: string(),
	version: number(),
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
