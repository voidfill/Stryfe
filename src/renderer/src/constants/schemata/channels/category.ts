import { equal, permission_overwrite } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { array, nullable, number, object, optional, string } from "valibot";

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
