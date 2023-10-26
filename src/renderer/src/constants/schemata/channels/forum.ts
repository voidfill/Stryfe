import { equal, equalArray, permission_overwrite } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { array, nullable, number, object, optional, string, unknown } from "valibot";

export default object({
	available_tags: nullable(array(unknown())),
	default_auto_archive_duration: optional(number()),
	default_forum_layout: optional(number()),
	default_reaction_emoji: optional(
		nullable(
			object({
				emoji_id: nullable(string()),
				emoji_name: nullable(string()),
			}),
		),
	),
	default_sort_order: optional(nullable(equalArray([0, 1] as const))),
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
	last_message_id: nullable(string()),
	name: string(),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	template: string(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_FORUM),
});
