import { hashes, user } from "../common";
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

import { discriminatedUnion } from "@renderer/constants/discriminatedUnion";
import { merge, nullable, object, optional, string } from "valibot";

export const private_channel = discriminatedUnion("type", [directMessage, groupDirectMessage]);

export const guild_channel = discriminatedUnion("type", [text, voice, stage_voice, category, announcement, directory, forum, media]);

export const CHANNEL_CREATE = discriminatedUnion("type", [
	directMessage,
	groupDirectMessage,
	//
	merge([text, object({ guild_id: string() })]),
	merge([voice, object({ guild_id: string() })]),
	merge([stage_voice, object({ guild_id: string() })]),
	merge([category, object({ guild_id: string() })]),
	merge([announcement, object({ guild_id: string() })]),
	merge([directory, object({ guild_id: string() })]),
	merge([forum, object({ guild_id: string() })]),
	merge([media, object({ guild_id: string() })]),
]);

export const CHANNEL_UPDATE = CHANNEL_CREATE;

export const CHANNEL_DELETE = discriminatedUnion("type", [
	directMessage,
	groupDirectMessage,
	//
	merge([
		text,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		voice,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		stage_voice,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		category,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		announcement,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		directory,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		forum,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
	merge([
		media,
		object({
			guild_hashes: hashes,
			guild_id: string(),
			hashes: hashes,
		}),
	]),
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
