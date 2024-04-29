import { boolean, nullable, number, object, string } from "valibot";

import { user } from "../common";

export const GUILD_SOUNDBOARD_SOUND_CREATE = object({
	available: boolean(),
	emoji_id: nullable(string()),
	emoji_name: nullable(string()),
	guild_id: string(),
	id: string(),
	name: string(),
	sound_id: string(),
	user: user,
	user_id: string(),
	volume: number(),
});

export const GUILD_SOUNDBOARD_SOUND_UPDATE = GUILD_SOUNDBOARD_SOUND_CREATE;

export const GUILD_SOUNDBOARD_SOUND_DELETE = object({
	guild_id: string(),
	sound_id: string(),
});
