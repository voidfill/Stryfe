import { user } from "../common";

import { array, boolean, nullable, number, object, string } from "valibot";

export default object({
	avatar: nullable(string()),
	communication_disabled_until: nullable(string()),
	deaf: boolean(),
	flags: number(),
	joined_at: string(),
	mute: boolean(),
	nick: nullable(string()),
	pending: boolean(),
	premium_since: nullable(string()),
	roles: nullable(array(string())),
	user: user,
});
