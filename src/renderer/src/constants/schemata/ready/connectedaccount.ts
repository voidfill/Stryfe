import { boolean, number, object, optional, special, string } from "valibot";

import { PlatformTypes } from "@constants/user";

const platformType = special<PlatformTypes>((v) => {
	if (typeof v !== "string") return false;
	return Object.values(PlatformTypes).includes(v as PlatformTypes);
});

export default object({
	access_token: optional(string()),
	friend_sync: boolean(),
	id: string(),
	metadata_visibility: number(),
	name: string(),
	revoked: boolean(),
	show_activity: boolean(),
	two_way_link: boolean(),
	type: platformType,
	verified: boolean(),
	visibility: number(),
});
