import { array, literal, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

export default object({
	flags: number(),
	icon: nullable(string()),
	id: string(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: nullable(string()),
	owner_id: string(),
	recipient_ids: array(string()),
	type: literal(ChannelTypes.GROUP_DM),
});
