import { array, boolean, nullable, number, object, optional, string, union } from "valibot";

import { avatar_decoration_data, user } from "../common";
import { PRESENCE_UPDATE } from "../presence";

const member = object({
	avatar: nullable(string()),
	avatar_decoration_data: optional(nullable(avatar_decoration_data)),
	communication_disabled_until: nullable(string()),
	deaf: optional(boolean()),
	flags: number(),
	joined_at: string(),
	mute: optional(boolean()),
	nick: nullable(string()),
	pending: boolean(),
	premium_since: nullable(string()),
	roles: nullable(array(string())),
	unusual_dm_activity_until: optional(nullable(string())),
	user: user,
});

export default member;

export const GUILD_MEMBER_ADD = object({ ...member.entries, guild_id: string() });

export const GUILD_MEMBER_UPDATE = GUILD_MEMBER_ADD;

export const GUILD_MEMBER_REMOVE = object({
	guild_id: string(),
	user: union([user, object({ id: string() })]),
});

export const GUILD_MEMBERS_CHUNK = object({
	chunk_count: number(),
	chunk_index: number(),
	guild_id: string(),
	members: nullable(array(member)),
	not_found: nullable(array(string())),
	presences: nullable(array(PRESENCE_UPDATE)),
});
