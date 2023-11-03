import { equal } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { boolean, nullable, number, object, optional, string, tuple } from "valibot";

export default object({
	flags: number(),
	id: string(),
	is_spam: boolean(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	recipient_ids: tuple([string()]),
	type: equal(ChannelTypes.DM),
});
