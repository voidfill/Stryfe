import { batch, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";

import member from "@constants/schemata/guild/member";
import { merged_member } from "@constants/schemata/ready";

import Store from ".";
import ChannelStore from "./channels";
import UserStore from "./users";

import { Output } from "valibot";

type storedMember = DistributiveOmit<Output<typeof member>, "user" | "roles">;

const [members, setMembers] = createStore<{
	[guildId: string]: {
		[userId: string]: storedMember;
	};
}>({});

function intoStored(m: Output<typeof merged_member> | Output<typeof member>): storedMember {
	if ("user" in m) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { user, roles, ...rest } = m;
		return rest;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { roles, user_id, ...rest } = m;
	return rest;
}

export default new (class MemberStore extends Store {
	#requesting = new Map<string, Set<string>>();

	constructor() {
		super({
			GUILD_CREATE: (guild) => {
				if (guild.unavailable) return;

				batch(() => {
					if (!members[guild.id]) setMembers(guild.id, {});
					for (const member of guild.members ?? []) setMembers(guild.id, member.user.id, intoStored(member));
				});
			},
			GUILD_DELETE: ({ id, unavailable }) => {
				if (unavailable) return;
				setMembers(produce((m) => delete m[id]));
			},
			GUILD_MEMBER_ADD: ({ guild_id, ...member }) => {
				if (!members[guild_id]) setMembers(guild_id, {});
				setMembers(guild_id, member.user.id, intoStored(member));
			},
			GUILD_MEMBER_REMOVE: ({ guild_id, user }) => {
				setMembers(
					guild_id,
					produce((m) => delete m[user.id]),
				);
			},
			GUILD_MEMBER_UPDATE: ({ guild_id, ...member }) => {
				if (!members[guild_id]) setMembers(guild_id, {});
				setMembers(guild_id, member.user.id, intoStored(member));
			},
			GUILD_MEMBERS_CHUNK: ({ guild_id, members: chunk }) => {
				if (!members[guild_id]) setMembers(guild_id, {});
				setMembers(
					guild_id,
					produce((m) => {
						for (const member of chunk) {
							m[member.user.id] = intoStored(member);
							this.#requesting.get(guild_id)?.delete(member.user.id);
						}
					}),
				);
			},
			MESSAGE_CREATE: ({ guild_id, member, author }) => {
				if (!guild_id || !member) return;
				if (!members[guild_id]) setMembers(guild_id, {});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { roles, ...rest } = member;
				setMembers(guild_id, author.id, rest);
			},
			MESSAGE_UPDATE: ({ guild_id, member, author }) => {
				if (!guild_id || !member || !author) return;
				if (!members[guild_id]) setMembers(guild_id, {});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { roles, ...rest } = member;
				setMembers(guild_id, author.id, rest);
			},
			MESSAGES_FETCH_SUCCESS: ({ channelId, messages }) => {
				const guildId = untrack(() => ChannelStore.getGuildChannel(channelId)?.guild_id);
				if (!guildId || !messages?.length) return;

				const toRequest = new Set<string>();
				untrack(() => {
					for (const { author } of messages) if (author && !members[guildId]?.[author.id]) toRequest.add(author.id);
				});

				this.requestMembers(guildId, toRequest);
			},
			READY: ({ guilds, merged_members }) => {
				batch(() => {
					for (let i = 0; i < (guilds?.length ?? 0); i++) {
						const guildId = guilds![i].id;
						if (!members[guildId]) setMembers(guildId, {});

						const m = merged_members![i]![0];
						setMembers(guildId, m.user_id, intoStored(m));
					}
				});
			},
			READY_SUPPLEMENTAL: ({ guilds, merged_members }) => {
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
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getMember(guildId: string, userId: string): storedMember | undefined {
		return members[guildId]?.[userId];
	}

	// eslint-disable-next-line solid/reactivity
	getMembers(guildId: string): string[] | undefined {
		return members[guildId] ? Object.keys(members[guildId]) : undefined;
	}

	getGuildAvatarURL(guildId: string, userId: string, size = 128, animated = false): string {
		const member = this.getMember(guildId, userId);
		if (!member || !member.avatar) return UserStore.getAvatarUrl(userId, size, animated);
		animated = animated && member.avatar.startsWith("a_");

		return `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${member.avatar}.${animated ? "gif" : "webp"}?size=${size}`;
	}

	requestMembers(guildId: string, ids: Set<string>): void {
		if (!ids.size) return;
		if (!this.#requesting.has(guildId)) {
			this.#requesting.set(guildId, new Set(ids));
			window.gateway.requestMembers({
				guild_id: guildId,
				limit: 0,
				presences: true,
				user_ids: [...ids],
			});
		}

		const toRequest: string[] = [];
		for (const id of ids) if (!this.#requesting.get(guildId)!.has(id)) toRequest.push(id);
		if (!toRequest.length) return;
		window.gateway.requestMembers({
			guild_id: guildId,
			limit: 0,
			presences: true,
			user_ids: toRequest,
		});
	}
})();
