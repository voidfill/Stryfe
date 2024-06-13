import { array, boolean, literal, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { permission_overwrite } from "../common";

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
	nsfw: optional(boolean()),
	parent_id: optional(nullable(string())),
	permission_overwrites: nullable(array(permission_overwrite)),
	position: number(),
	rate_limit_per_user: number(),
	rtc_region: nullable(string()),
	theme_color: optional(nullable(number())),
	topic: nullable(string()),
	type: literal(ChannelTypes.GUILD_STAGE_VOICE),
	user_limit: number(),
	video_quality_mode: optional(number()),
});
