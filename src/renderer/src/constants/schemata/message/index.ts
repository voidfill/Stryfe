import { MessageType } from "@constants/message";

import { user } from "../common";
import guild_member from "../guild/member";
import attachment from "./attachment";
import component from "./component";
import embed from "./embed";

import { array, boolean, merge, nullable, number, object, omit, optional, partial, special, string } from "valibot";

export const MessageTypeSchema = special<MessageType>((value) => {
	if (typeof value !== "number") return false;
	return Object.values(MessageType).includes(value);
});

export const genericMessage = object({
	attachments: nullable(array(attachment)),
	author: user,
	channel_id: string(),
	components: nullable(array(component)),
	content: string(),
	edited_timestamp: nullable(string()),
	embeds: nullable(array(embed)),
	flags: nullable(number()),
	guild_id: optional(string()),
	id: string(),
	member: optional(omit(guild_member, ["user"])),
	mention_everyone: boolean(),
	mention_roles: nullable(array(string())),
	mentions: nullable(array(user)),
	message_reference: optional(
		object({
			channel_id: string(),
			guild_id: optional(string()),
			message_id: string(),
		}),
	),
	nonce: optional(nullable(string())),
	pinned: boolean(),
	timestamp: string(),
	tts: boolean(),
	type: MessageTypeSchema,
});

export const MESSAGE_CREATE = merge([
	genericMessage,
	object({
		referenced_message: optional(nullable(genericMessage)),
	}),
]);

export const MESSAGE_UPDATE = merge([
	partial(omit(MESSAGE_CREATE, ["id", "channel_id"])),
	object({
		channel_id: string(),
		id: string(),
	}),
]);

// export const MESSAGE_UPDATE_ = object({
// 	attachments: optional(nullable(array(attachment))),
// 	author: optional(user),
// 	channel_id: string(),
// 	components: optional(nullable(array(component))),
// 	content: optional(string()),
// 	edited_timestamp: optional(nullable(string())),
// 	embeds: optional(nullable(array(embed))),
// 	flags: optional(nullable(number())),
// 	guild_id: optional(string()),
// 	id: string(),
// 	member: optional(optional(omit(guild_member, ["user"]))),
// 	mention_everyone: optional(boolean()),
// 	mention_roles: optional(nullable(array(string()))),
// 	mentions: optional(nullable(array(user))),
// 	message_reference: optional(
// 		object({
// 			channel_id: string(),
// 			guild_id: optional(string()),
// 			message_id: string(),
// 		}),
// 	),
// 	nonce: optional(nullable(string())),
// 	pinned: optional(boolean()),
// 	referenced_message: optional(nullable(genericMessage)),
// 	timestamp: optional(string()),
// 	tts: optional(boolean()),
// 	type: optional(MessageTypeSchema),
// });

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
