import { equal } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { array, nullable, number, object, optional, string } from "valibot";

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
