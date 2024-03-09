import { array, nullable, number, object, optional, string } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { equal } from "../common";

export default object({
	flags: number(),
	icon: nullable(string()),
	id: string(),
	last_message_id: nullable(string()),
	last_pin_timestamp: optional(nullable(string())),
	name: nullable(string()),
	owner_id: string(),
	recipient_ids: array(string()),
	type: equal(ChannelTypes.GROUP_DM),
});
