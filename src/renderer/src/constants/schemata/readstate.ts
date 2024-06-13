import { boolean, literal, nullable, number, object, optional, picklist, string, union } from "valibot";

export const enum ReadStateType {
	CHANNEL = 0,
	GUILD_EVENT = 1,
	NOTIFICATION_CENTER = 2,
	GUILD_HOME = 3,
	GUILD_ONBOARDING_QUESTION = 4,
}

export const read_state_entry = union([
	object({
		flags: number(),
		id: string(),
		last_message_id: union([literal(0), string()]),
		last_pin_timestamp: string(),
		last_viewed: optional(number()),
		mention_count: number(),
	}),
	object({
		badge_count: number(),
		id: string(),
		last_acked_id: string(),
		read_state_type: picklist([
			ReadStateType.GUILD_EVENT,
			ReadStateType.NOTIFICATION_CENTER,
			ReadStateType.GUILD_HOME,
			ReadStateType.GUILD_ONBOARDING_QUESTION,
		]),
	}),
]);

export const GUILD_FEATURE_ACK = object({
	ack_type: picklist([ReadStateType.GUILD_EVENT, ReadStateType.GUILD_HOME, ReadStateType.GUILD_ONBOARDING_QUESTION]),
	entity_id: string(),
	resource_id: string(),
	version: number(),
});

export const USER_NON_CHANNEL_ACK = object({
	ack_type: literal(ReadStateType.NOTIFICATION_CENTER),
	entity_id: string(),
	resource_id: string(),
	version: number(),
});

export const RECENT_MENTION_DELETE = object({
	message_id: string(),
});

export const CHANNEL_PINS_ACK = object({
	channel_id: string(),
	timestamp: string(),
	version: number(),
});

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
