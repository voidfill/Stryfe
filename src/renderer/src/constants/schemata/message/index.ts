import { array, boolean, enum_, nullable, number, object, omit, optional, picklist, string } from "valibot";

import { MessageType } from "@constants/message";

import { user } from "../common";
import guild_member from "../guild/member";
import { StickerFormatType } from "../guild/sticker";
import attachment from "./attachment";
import component from "./component";
import embed from "./embed";

export const genericMessage = object({
	attachments: nullable(array(attachment)),
	author: user,
	channel_id: string(),
	components: nullable(array(component)),
	content: string(),
	edited_timestamp: nullable(string()),
	embeds: nullable(array(embed)),
	flags: nullable(number()),
	id: string(),
	mention_everyone: boolean(),
	mention_roles: nullable(array(string())),
	mentions: nullable(array(user)),
	message_reference: optional(
		object({
			channel_id: string(),
			guild_id: optional(string()),
			message_id: optional(string()),
		}),
	),
	nonce: optional(nullable(string())),
	pinned: boolean(),
	sticker_items: optional(
		array(
			object({
				format_type: picklist([StickerFormatType.PNG, StickerFormatType.APNG, StickerFormatType.LOTTIE, StickerFormatType.GIF]),
				id: string(),
				name: string(),
			}),
		),
	),
	timestamp: string(),
	tts: boolean(),
	type: enum_(MessageType),
	webhook_id: optional(string()),
});

export const MESSAGE_CREATE = object({
	...genericMessage.entries,
	guild_id: optional(string()),
	member: optional(omit(guild_member, ["user"])),
	referenced_message: optional(nullable(genericMessage)),
});

export const MESSAGE_UPDATE = object({
	...MESSAGE_CREATE.entries,
	guild_id: optional(string()),
});

export const MESSAGE_DELETE = object({
	channel_id: string(),
	guild_id: optional(string()),
	id: string(),
});

export const MESSAGE_DELETE_BULK = object({
	channel_id: string(),
	guild_id: optional(string()),
	ids: array(string()),
});

export const MESSAGE_REACTION_ADD_MANY = object({
	channel_id: string(),
	guild_id: optional(string()),
	message_id: string(),
	reactions: array(
		object({
			emoji: object({ animated: optional(boolean()), id: nullable(string()), name: string() }),
			users: array(string()),
		}),
	),
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

export const MESSAGE_REACTION_REMOVE_ALL = object({
	channel_id: string(),
	guild_id: optional(string()),
	message_id: string(),
});

export const MESSAGE_REACTION_REMOVE_EMOJI = object({
	channel_id: string(),
	emoji: object({
		id: nullable(string()),
		name: nullable(string()),
	}),
	guild_id: optional(string()),
	message_id: string(),
});
