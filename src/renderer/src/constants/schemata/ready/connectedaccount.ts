import { boolean, enum_, number, object, optional, string } from "valibot";

import { PlatformTypes } from "@constants/user";

export default object({
	access_token: optional(string()),
	friend_sync: boolean(),
	id: string(),
	metadata_visibility: number(),
	name: string(),
	revoked: boolean(),
	show_activity: boolean(),
	two_way_link: boolean(),
	type: enum_(PlatformTypes),
	verified: boolean(),
	visibility: number(),
});
