import { boolean, nullable, number, object, optional, string } from "valibot";

const role = object({
	color: number(),
	flags: number(),
	hoist: boolean(),
	icon: nullable(string()),
	id: string(),
	managed: boolean(),
	mentionable: boolean(),
	name: string(),
	permissions: string(),
	position: number(),
	tags: optional(
		object({
			bot_id: optional(string()),
		}),
	),
	unicode_emoji: nullable(string()),
});

export default role;

export const GUILD_ROLE_CREATE = object({
	guild_id: string(),
	role: role,
});

export const GUILD_ROLE_UPDATE = GUILD_ROLE_CREATE;

export const GUILD_ROLE_DELETE = object({
	guild_id: string(),
	role_id: string(),
	version: string(),
});
