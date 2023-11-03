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
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_TEXT),
});
