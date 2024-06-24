import { batch, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import { guildMemberAvatarURL } from "@constants/images";
import member from "@constants/schemata/guild/member";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";
import { getGuildChannel } from "./channels";
import { getAvatarUrl, getUser } from "./users";

type storedMember = DistributiveOmit<InferOutput<typeof member>, "user" | "roles">;

const [members, setMembers] = createStore<{
	[guildId: string]: {
		[userId: string]: storedMember;
	};
}>({});

function intoStored<T extends storedMember>(m: T): storedMember {
	const {
		avatar,
		avatar_decoration_data,
		communication_disabled_until,
		deaf,
		mute,
		nick,
		premium_since,
		unusual_dm_activity_until,
		flags,
		joined_at,
		pending,
	} = m;
	return {
		avatar,
		avatar_decoration_data,
		communication_disabled_until,
		deaf,
		flags,
		joined_at,
		mute,
		nick,
		pending,
		premium_since,
		unusual_dm_activity_until,
	};
}

const requesting = new Map<string, Set<string>>();

on("GUILD_CREATE", (guild) => {
	if (guild.unavailable) return;

	batch(() => {
		if (!members[guild.id]) setMembers(guild.id, {});
		setMembers(
			guild.id,
			produce((m) => {
				for (const member of guild.members ?? []) m[member.user.id] = intoStored(member);
			}),
		);
	});
});

on("GUILD_DELETE", ({ id, unavailable }) => {
	if (unavailable) return;
	setMembers(produce((m) => delete m[id]));
});

on("GUILD_MEMBER_ADD", ({ guild_id, ...member }) => {
	if (!members[guild_id]) setMembers(guild_id, {});
	setMembers(guild_id, member.user.id, intoStored(member));
});

on("GUILD_MEMBER_REMOVE", ({ guild_id, user }) => {
	setMembers(
		guild_id,
		produce((m) => delete m[user.id]),
	);
});

on("GUILD_MEMBER_UPDATE", ({ guild_id, ...member }) => {
	if (!members[guild_id]) setMembers(guild_id, {});
	setMembers(guild_id, member.user.id, intoStored(member));
});

on("GUILD_MEMBERS_CHUNK", ({ guild_id, members: chunk }) => {
	if (!members[guild_id]) setMembers(guild_id, {});
	const r = requesting.get(guild_id);
	setMembers(
		guild_id,
		produce((m) => {
			for (const member of chunk ?? []) {
				m[member.user.id] = intoStored(member);
				r?.delete(member.user.id);
			}
		}),
	);
});

on("MESSAGE_CREATE", ({ guild_id, member, author }) => {
	if (!guild_id || !member) return;
	if (!members[guild_id]) setMembers(guild_id, {});
	setMembers(guild_id, author.id, intoStored(member));
});

on("MESSAGE_UPDATE", ({ guild_id, member, author }) => {
	if (!guild_id || !member || !author) return;
	if (!members[guild_id]) setMembers(guild_id, {});
	setMembers(guild_id, author.id, intoStored(member));
});

on("MESSAGES_FETCH_SUCCESS", ({ channelId, messages }) => {
	const guildId = untrack(() => getGuildChannel(channelId)?.guild_id);
	if (!guildId || !messages?.length) return;

	const toRequest = new Set<string>();
	untrack(() => {
		for (const { author } of messages) if (author && !members[guildId]?.[author.id]) toRequest.add(author.id);
	});

	requestMembers(guildId, toRequest);
});

on("READY", ({ guilds, merged_members }) => {
	batch(() => {
		for (let i = 0; i < (guilds?.length ?? 0); i++) {
			const guildId = guilds![i].id;
			if (!members[guildId]) setMembers(guildId, {});

			const m = merged_members![i]?.[0];
			if (!m) continue;
			setMembers(guildId, m.user_id, intoStored(m));
		}
	});
});

on("READY_SUPPLEMENTAL", ({ guilds, merged_members }) => {
	batch(() => {
		for (let i = 0; i < (guilds?.length ?? 0); i++) {
			const guildId = guilds![i].id;
			if (!members[guildId]) setMembers(guildId, {});

			setMembers(
				guildId,
				produce((m) => {
					for (const member of merged_members![i] ?? []) m[member.user_id] = intoStored(member);
				}),
			);
		}
	});
});

on("TYPING_START", ({ guild_id, member }) => {
	if (!guild_id || !member) return;
	if (!members[guild_id]) setMembers(guild_id, {});
	setMembers(guild_id, member.user.id, intoStored(member));
});

on("VOICE_STATE_UPDATE", (vs) => {
	if ("member" in vs && vs.member && vs.guild_id) {
		if (!members[vs.guild_id]) setMembers(vs.guild_id, {});
		setMembers(vs.guild_id, vs.user_id, intoStored(vs.member));
	}
});

export const hasMember = p((guildId: string, userId: string): boolean => !!members[guildId]?.[userId]);

export const getMember = p((guildId: string, userId: string): storedMember | undefined => members[guildId]?.[userId]);

export const getMembers = p((guildId: string): string[] | undefined => (members[guildId] ? Object.keys(members[guildId]) : undefined));

export const requestMembers = p((guildId: string, ids: Set<string>) => {
	if (!ids.size) return;
	if (!requesting.has(guildId)) {
		requesting.set(guildId, ids);
		window.gateway.requestMembers({
			guild_id: guildId,
			limit: 0,
			presences: true,
			user_ids: [...ids],
		});
	}

	const r = requesting.get(guildId);
	const toRequest: string[] = [];
	for (const id of ids)
		if (!r!.has(id)) {
			toRequest.push(id);
			r!.add(id);
		}

	if (!toRequest.length) return;
	window.gateway.requestMembers({
		guild_id: guildId,
		limit: 0,
		presences: true,
		user_ids: toRequest,
	});
});

export const getGuildAvatarURL = p((guildId: string, userId: string, size = 128, animated = false): string => {
	const member = getMember(guildId, userId);
	if (!member || !member.avatar) return getAvatarUrl(userId, size, animated);
	animated = animated && member.avatar.startsWith("a_");

	return guildMemberAvatarURL(guildId, userId, member.avatar, size, animated);
});

export const getName = p((guildId: string, userId: string): string | undefined => {
	const member = getMember(guildId, userId);
	if (member?.nick) return member.nick;
	const user = getUser(userId);
	if (!user) return undefined;
	return user.display_name || user.username;
});

registerDebugStore("members", { getGuildAvatarURL, getMember, getMembers, getName, hasMember, requestMembers, state: { members } });
