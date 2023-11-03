import { equal } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { number, object, string, unknown } from "valibot";

export default object({
	TODO: unknown(),
	id: string(),
	position: number(),
	type: equal(ChannelTypes.GUILD_DIRECTORY),
});
