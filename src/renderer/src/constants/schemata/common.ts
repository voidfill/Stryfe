import { boolean, nullable, number, object, optional, special, SpecialSchema, string, union, unknown } from "valibot";

import { PremiumTypes } from "../user";

export function equal<T extends number | string | boolean>(v: T): SpecialSchema<T> {
	return special((a) => a === v);
}
export function equalArray<T extends readonly (number | string | boolean)[]>(v: T): SpecialSchema<T[number]> {
	return special((a) => v.some((b) => a === b));
}

export const status = equalArray(["online", "idle", "dnd", "offline", "invisible", "unknown"] as const);

export const clan = union([
	object({
		identity_enabled: equal(false),
	}),
	object({
		badge: string(),
		identity_enabled: equal(true),
		identity_guild_id: string(),
		tag: string(),
	}),
]);

export const permission_overwrite = object({
	allow: string(),
	deny: string(),
	id: string(),
	type: equalArray([0, 1] as const),
});

export const user = object({
	avatar: nullable(string()),
	avatar_decoration_data: optional(
		nullable(
			object({
				asset: string(),
				sku_id: string(),
			}),
		),
	),
	bot: optional(boolean()),
	clan: optional(nullable(clan)),
	discriminator: string(),
	display_name: optional(nullable(string())),
	global_name: optional(nullable(string())),
	id: string(),
	public_flags: optional(number()),
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
	discriminator: string(),
	display_name: optional(nullable(string())),
	email: nullable(string()),
	global_name: nullable(string()),
	id: string(),
	mfa_enabled: boolean(),
	nsfw_allowed: boolean(),
	phone: nullable(string()),
	premium: boolean(),
	premium_type: special<PremiumTypes>((a) => {
		if (typeof a !== "number") return false;
		return Object.values(PremiumTypes).includes(a as PremiumTypes);
	}),
	pronouns: string(),
	purchased_flags: number(),
	username: string(),
	verified: boolean(),
});
