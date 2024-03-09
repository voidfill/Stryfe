import { array, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { equal, permission_overwrite } from "../common";

export default object({
	flags: number(),
	icon_emoji: optional(
		nullable(
			object({
				id: nullable(string()),
				name: string(),
			}),
		),
	),
	id: string(),
	name: string(),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	theme_color: optional(nullable(number())),
	type: equal(ChannelTypes.GUILD_CATEGORY),
});
