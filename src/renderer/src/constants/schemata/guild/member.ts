import { array, boolean, merge, nullable, number, object, string } from "valibot";

import { user } from "../common";
import { PRESENCE_UPDATE } from "../presence";

const member = object({
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

export default member;

export const GUILD_MEMBER_ADD = merge([
	member,
	object({
		guild_id: string(),
	}),
]);

export const GUILD_MEMBER_UPDATE = GUILD_MEMBER_ADD;

export const GUILD_MEMBER_REMOVE = object({
	guild_id: string(),
	user: user,
});

export const GUILD_MEMBERS_CHUNK = object({
	chunk_count: number(),
	chunk_index: number(),
	guild_id: string(),
	members: nullable(array(member)),
	not_found: nullable(array(string())),
	presences: nullable(array(PRESENCE_UPDATE)),
});
