import { number, object, string, unknown } from "valibot";

import { ChannelTypes } from "@constants/channel";

import { equal } from "../common";

export default object({
	TODO: unknown(),
	id: string(),
	name: string(),
	position: number(),
	type: equal(ChannelTypes.GUILD_DIRECTORY),
});
