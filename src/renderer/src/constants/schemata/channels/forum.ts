import { equal, equalArray, permission_overwrite } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { array, boolean, nullable, number, object, optional, string } from "valibot";

export const tag = object({
	emoji_id: nullable(string()),
	emoji_name: nullable(string()),
	id: string(),
	moderated: boolean(),
	name: string(),
});

export const default_reaction_emoji = optional(
	nullable(
		object({
			emoji_id: nullable(string()),
			emoji_name: nullable(string()),
		}),
	),
);

export const icon_emoji = optional(
	nullable(
		object({
			id: nullable(string()),
			name: string(),
		}),
	),
);

export default object({
	available_tags: nullable(array(tag)),
	default_auto_archive_duration: optional(number()),
	default_forum_layout: optional(number()),
	default_reaction_emoji: default_reaction_emoji,
	default_sort_order: optional(nullable(equalArray([0, 1] as const))),
	default_thread_rate_limit_per_user: optional(number()),
	flags: number(),
	icon_emoji: icon_emoji,
	id: string(),
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
