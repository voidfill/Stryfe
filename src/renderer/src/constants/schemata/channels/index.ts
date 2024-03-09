import { array, merge, nullable, object, omit, optional, string, variant } from "valibot";

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

const guildIdObject = object({ guild_id: string() });

export const CHANNEL_CREATE = variant("type", [
	merge([omit(directMessage, ["recipient_ids"]), object({ recipients: array(user) })]),
	merge([omit(groupDirectMessage, ["recipient_ids"]), object({ recipients: array(user) })]),
	//
	merge([text, guildIdObject]),
	merge([voice, guildIdObject]),
	merge([stage_voice, guildIdObject]),
	merge([category, guildIdObject]),
	merge([announcement, guildIdObject]),
	merge([directory, guildIdObject]),
	merge([forum, guildIdObject]),
	merge([media, guildIdObject]),
]);

export const CHANNEL_UPDATE = CHANNEL_CREATE;

export const CHANNEL_DELETE = variant("type", [
	omit(directMessage, ["is_spam", "recipient_ids"]),
	omit(groupDirectMessage, ["recipient_ids"]),
	//
	merge([text, guildIdObject]),
	merge([voice, guildIdObject]),
	merge([stage_voice, guildIdObject]),
	merge([category, guildIdObject]),
	merge([announcement, guildIdObject]),
	merge([directory, guildIdObject]),
	merge([forum, guildIdObject]),
	merge([media, guildIdObject]),
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
