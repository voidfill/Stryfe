import { array, nullable, object, omit, optional, string, variant } from "valibot";

import { user } from "../common";
import announcement from "./announcement";
import category from "./category";
import directMessage from "./directmessage";
import directory from "./directory";
import forum from "./forum";
import groupDirectMessage from "./groupdirectmessage";
import media from "./media";
import stage_voice from "./stagevoice";
import text from "./text";
import voice from "./voice";

export const private_channel = variant("type", [directMessage, groupDirectMessage]);

export const guild_channel = variant("type", [text, voice, stage_voice, category, announcement, directory, forum, media]);

const extras = object({ guild_id: string(), version: string() });

export const CHANNEL_CREATE = variant("type", [
	object({ ...directMessage.entries, recipients: array(user) }),
	object({ ...groupDirectMessage.entries, recipients: array(user) }),
	//
	object({ ...text.entries, ...extras.entries }),
	object({ ...voice.entries, ...extras.entries }),
	object({ ...stage_voice.entries, ...extras.entries }),
	object({ ...category.entries, ...extras.entries }),
	object({ ...announcement.entries, ...extras.entries }),
	object({ ...directory.entries, ...extras.entries }),
	object({ ...forum.entries, ...extras.entries }),
	object({ ...media.entries, ...extras.entries }),
]);

export const CHANNEL_UPDATE = CHANNEL_CREATE;

export const CHANNEL_DELETE = variant("type", [
	omit(directMessage, ["is_spam", "recipient_ids"]),
	omit(groupDirectMessage, ["recipient_ids"]),
	//
	object({ ...text.entries, ...extras.entries }),
	object({ ...voice.entries, ...extras.entries }),
	object({ ...stage_voice.entries, ...extras.entries }),
	object({ ...category.entries, ...extras.entries }),
	object({ ...announcement.entries, ...extras.entries }),
	object({ ...directory.entries, ...extras.entries }),
	object({ ...forum.entries, ...extras.entries }),
	object({ ...media.entries, ...extras.entries }),
]);

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
