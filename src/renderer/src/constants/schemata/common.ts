import { boolean, enum_, literal, nullable, number, object, optional, picklist, string, union, unknown } from "valibot";

import { PremiumTypes } from "../user";

export const status = picklist(["online", "idle", "dnd", "offline", "invisible", "unknown"]);

export const clan = union([
	object({
		identity_enabled: literal(false),
	}),
	object({
		badge: string(),
		identity_enabled: literal(true),
		identity_guild_id: string(),
		tag: string(),
	}),
]);

export const permission_overwrite = object({
	allow: string(),
	deny: string(),
	id: string(),
	type: picklist([0, 1]),
});

export const avatar_decoration_data = object({
	asset: string(),
	sku_id: string(),
});

export const user = object({
	avatar: nullable(string()),
	avatar_decoration_data: optional(nullable(avatar_decoration_data)),
	bot: optional(boolean()),
	clan: optional(nullable(clan)),
	discriminator: string(),
	display_name: optional(nullable(string())),
	global_name: optional(nullable(string())),
	id: string(),
	public_flags: optional(number()),
	system: optional(boolean()),
	username: string(),
});

export const user_self = object({
	accent_color: unknown(),
	avatar: nullable(string()),
	avatar_decoration_data: nullable(
		object({
			asset: string(),
			sku_id: string(),
		}),
	),
	banner: nullable(string()),
	banner_color: unknown(),
	bio: string(),
	clan: optional(nullable(clan)),
	desktop: boolean(),
	discriminator: string(),
	display_name: optional(nullable(string())),
	email: nullable(string()),
	flags: number(),
	global_name: nullable(string()),
	id: string(),
	mfa_enabled: boolean(),
	mobile: boolean(),
	nsfw_allowed: boolean(),
	phone: nullable(string()),
	premium: boolean(),
	premium_type: enum_(PremiumTypes),
	pronouns: string(),
	purchased_flags: number(),
	username: string(),
	verified: boolean(),
});
