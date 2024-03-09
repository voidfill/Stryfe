import { array, boolean, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { equal, equalArray, permission_overwrite } from "../common";
import { default_reaction_emoji, icon_emoji, tag } from "./forum";

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
	nsfw: optional(boolean()),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	template: string(),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: equal(ChannelTypes.GUILD_MEDIA),
});
