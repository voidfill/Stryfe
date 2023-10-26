import { equal, permission_overwrite } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { array, nullable, number, object, optional, string } from "valibot";

export default object({
	bitrate: number(),
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
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rtc_region: nullable(string()),
	theme_color: optional(nullable(number())),
	type: equal(ChannelTypes.GUILD_VOICE),
	user_limit: number(),
});
