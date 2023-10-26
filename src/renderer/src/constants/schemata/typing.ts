import guild_member from "./guild/member";

import { number, object, optional, string } from "valibot";

export const TYPING_START = object({
	channel_id: string(),
	guild_id: optional(string()),
	member: optional(guild_member),
	timestamp: number(),
	user_id: string(),
});
