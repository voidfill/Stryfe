import { equal } from "../common";

import { ChannelTypes } from "@renderer/constants/channel";
import { object, unknown } from "valibot";

export default object({
	TODO: unknown(),
	type: equal(ChannelTypes.GUILD_DIRECTORY),
});
