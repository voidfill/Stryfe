import { boolean, literal, nullable, number, object, optional, string, tuple, unknown } from "valibot";

import { ChannelTypes } from "@constants/channel";

export default object({
	flags: number(),
	id: string(),
	is_message_request: optional(boolean()),
	is_message_request_timestamp: optional(nullable(string())),
	is_spam: optional(boolean()),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	recipient_ids: tuple([string()]),
	safety_warnings: optional(unknown()),
	type: literal(ChannelTypes.DM),
});
