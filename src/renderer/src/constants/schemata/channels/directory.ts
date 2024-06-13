import { literal, number, object, string, unknown } from "valibot";

import { ChannelTypes } from "@constants/channel";

export default object({
	TODO: unknown(),
	id: string(),
	name: string(),
	position: number(),
	type: literal(ChannelTypes.GUILD_DIRECTORY),
});
