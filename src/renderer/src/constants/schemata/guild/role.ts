import { boolean, nullable, number, object, optional, string, unknown } from "valibot";

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
			available_for_purchase: optional(nullable(unknown())),
			bot_id: optional(string()),
			guild_connections: optional(nullable(unknown())),
			integration_id: optional(string()),
			is_guild_product_role: optional(boolean()),
			premium_subscriber: optional(nullable(unknown())),
			subscription_listing_id: optional(nullable(string())),
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
