import { array, boolean, literal, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { permission_overwrite } from "../common";

export default object({
	default_auto_archive_duration: optional(number()),
	default_thread_rate_limit_per_user: optional(number()),
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
	nsfw: optional(boolean()),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: literal(ChannelTypes.GUILD_TEXT),
});
