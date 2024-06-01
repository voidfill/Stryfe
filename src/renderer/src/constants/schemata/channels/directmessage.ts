import { boolean, nullable, number, object, optional, string, tuple } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { equal } from "../common";

export default object({
	flags: number(),
	id: string(),
	is_spam: optional(boolean()),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	recipient_ids: tuple([string()]),
	type: equal(ChannelTypes.DM),
});
