import { batch, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import { Output } from "valibot";

import role from "@constants/schemata/guild/role";

import logger from "@modules/logger";

import Store from ".";

const [roles, setRoles] = createStore<{
	[id: string]: DistributiveOmit<Output<typeof role>, "id" | "permissions"> & {
		permissions: bigint;
	};
}>({});
const [perGuild, setPerGuild] = createStore<{
	[guildId: string]: string[];
}>({});
// this might be okay if it was a normal store and used arrays, but considering we dont render all roles too frequently i think its worth saving on insertion/deletion costs
const perMember = new ReactiveMap<string, ReactiveMap<string, ReactiveSet<string>>>();

function sort<T extends { position: number }>(roles: T[]): T[] {
	return roles.sort((a, b) => a.position - b.position);
}

const timers = new Map<string, NodeJS.Timeout>();
function scheduleResort(guildId: string): void {
	if (timers.has(guildId)) {
		clearTimeout(timers.get(guildId)!);
	}

	timers.set(
		guildId,
		setTimeout(() => {
			untrack(() => {
				setPerGuild(guildId, (r) => sort(r.map((id) => ({ id, position: roles[id].position }))).map((r) => r.id));
			});
			timers.delete(guildId);
		}, 1000),
	);
}

export default new (class RolesStore extends Store {
	constructor() {
		super({
			GUILD_CREATE: (guild) => {
				if (guild.unavailable) return;

				batch(() => {
					setPerGuild(
						guild.id,
						sort(guild.roles).map((r) => r.id),
					);
					for (const { id, permissions, ...rest } of guild.roles) {
						setRoles(id, { ...rest, permissions: BigInt(permissions) });
					}

					if (!perMember.has(guild.id)) perMember.set(guild.id, new ReactiveMap());
					for (const member of guild.members ?? []) {
						perMember.get(guild.id)!.set(member.user.id, new ReactiveSet(member.roles));
					}
				});
			},
			GUILD_DELETE: ({ id, unavailable }) => {
				if (unavailable) return;

				const roles = perGuild[id];
				if (roles) {
					batch(() => {
						setPerGuild(
							produce((r) => {
								delete r[id];
							}),
						);
						setRoles(
							produce((r) => {
								for (const id of roles) delete r[id];
							}),
						);
					});
				}
				perMember.delete(id);
			},
			GUILD_MEMBERS_CHUNK: ({ guild_id, members }) => {
				if (!members?.length) return;

				batch(() => {
					if (!perMember.has(guild_id)) perMember.set(guild_id, new ReactiveMap());
					for (const member of members) {
						perMember.get(guild_id)!.set(member.user.id, new ReactiveSet(member.roles));
					}
				});
			},
			GUILD_ROLE_CREATE: ({ guild_id, role }) => {
				batch(() => {
					setRoles(role.id, { ...role, permissions: BigInt(role.permissions) });
					if (!perGuild[guild_id]) return logger.warn("GUILD_ROLE_CREATE: perGuild[guild_id] is undefined");

					setRoles(
						produce((r) => {
							for (let i = 1; i < perGuild[guild_id].length; i++) {
								r[perGuild[guild_id][i]].position = i + 1;
							}
						}),
					);

					setPerGuild(
						guild_id,
						produce((r) => {
							r.splice(role.position, 0, role.id);
						}),
					);
				});
			},
			GUILD_ROLE_DELETE: ({ guild_id, role_id }) => {
				batch(() => {
					setPerGuild(
						guild_id,
						perGuild[guild_id].filter((id) => id !== role_id),
					);
					setRoles(
						produce((r) => {
							delete r[role_id];
						}),
					);

					for (const roles of perMember.get(guild_id)?.values() ?? []) {
						roles.delete(role_id);
					}
				});
			},
			GUILD_ROLE_UPDATE: ({ guild_id, role }) => {
				batch(() => {
					const old = roles[role.id];
					if (!old) return logger.warn("GUILD_ROLE_UPDATE: old is undefined");
					if (old.position !== role.position) {
						scheduleResort(guild_id);
					}
					setRoles(role.id, { ...role, permissions: BigInt(role.permissions) });
				});
			},
			MESSAGE_CREATE: ({ guild_id, member, author }) => {
				if (!guild_id || !member) return;
				if (!perMember.has(guild_id)) perMember.set(guild_id, new ReactiveMap());
				const g = perMember.get(guild_id)!;
				if (!g.has(author.id)) g.set(author.id, new ReactiveSet(member.roles));
			},
			READY: ({ guilds, merged_members }) => {
				batch(() => {
					for (const guild of guilds ?? []) {
						if (guild.unavailable) continue;

						setPerGuild(
							guild.id,
							sort(guild.roles).map((r) => r.id),
						);
						for (const { id, ...rest } of guild.roles) {
							setRoles(id, { ...rest, permissions: BigInt(rest.permissions) });
						}
					}

					for (let i = 0; i < (guilds?.length ?? 0); i++) {
						const guildId = guilds![i].id;
						const mergedMember = merged_members![i]?.[0];
						if (!mergedMember) continue;
						if (!perMember.has(guildId)) perMember.set(guildId, new ReactiveMap());
						perMember.get(guildId)!.set(mergedMember.user_id, new ReactiveSet(mergedMember.roles));
					}
				});
			},
			READY_SUPPLEMENTAL: ({ guilds, merged_members }) => {
				batch(() => {
					for (let i = 0; i < (guilds?.length ?? 0); i++) {
						const guildId = guilds![i].id;
						const mergedMembers = merged_members![i];
						if (!perMember.has(guildId)) perMember.set(guildId, new ReactiveMap());
						const g = perMember.get(guildId)!;
						for (const member of mergedMembers ?? []) {
							g.set(member.user_id, new ReactiveSet(member.roles));
						}
					}
				});
			},
		});
	}

	roles = roles;
	perGuild = perGuild;

	// eslint-disable-next-line solid/reactivity
	getGuildRoles(guildId: string): string[] | undefined {
		return perGuild[guildId];
	}

	// eslint-disable-next-line solid/reactivity
	getRole(roleId: string): (typeof roles)[string] | undefined {
		return roles[roleId];
	}

	getMemberRoles(guildId: string, memberId: string): IterableIterator<string> | undefined {
		return perMember.get(guildId)?.get(memberId)?.values();
	}

	getHighestColoredForMember(guildId: string, memberId: string): string | undefined {
		const roles = this.getMemberRoles(guildId, memberId);
		let highest: string | undefined,
			rank = 0;

		for (const role of roles ?? []) {
			const r = this.getRole(role);
			if (!r?.color) continue;
			const roleRank = r?.position ?? 0;
			if (roleRank > rank) {
				rank = roleRank;
				highest = role;
			}
		}

		return highest;
	}
})();
