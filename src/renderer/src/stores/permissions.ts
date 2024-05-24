import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";

import permissions from "@constants/permissions";

import Store from ".";
import ChannelStore from "./channels";
import GuildStore from "./guilds";
import RolesStore from "./roles";

const [overwrites, setOverwrites] = createStore<{
	[channelId: string]: {
		[id: string]: {
			allow: bigint;
			deny: bigint;
			type: 0 | 1;
		};
	};
}>({});

export function hasBit(bits: bigint, bit: bigint): boolean {
	return (bits & bit) === bit;
}

function computeBasePermissions(guildId: string, memberId: string): bigint {
	const userRoles = RolesStore.getMemberRoles(guildId, memberId);

	let permissions = RolesStore.getRole(guildId)?.permissions ?? 0n;
	for (const role of userRoles ?? []) {
		permissions |= RolesStore.getRole(role)?.permissions ?? 0n;
	}

	return permissions;
}
function computeChannelOverwrites(basePermissions: bigint, guildId: string, channelId: string, memberId: string): bigint {
	const parentId = ChannelStore.getThread(channelId)?.parent_id;
	if (parentId) channelId = parentId;

	const o = overwrites[channelId];
	if (!o) return basePermissions;

	const everyoneOverwrite = o[guildId];
	if (everyoneOverwrite) {
		basePermissions &= ~everyoneOverwrite.deny;
		basePermissions |= everyoneOverwrite.allow;
	}

	let roleDeny = 0n,
		roleAllow = 0n;
	const roles = RolesStore.getMemberRoles(guildId, memberId);

	for (const roleId of roles ?? []) {
		const overwrite = o[roleId];
		if (!overwrite) continue;
		roleDeny |= overwrite.deny;
		roleAllow |= overwrite.allow;
	}

	basePermissions &= ~roleDeny;
	basePermissions |= roleAllow;

	const memberOverwrite = o[memberId];
	if (memberOverwrite) {
		basePermissions &= ~memberOverwrite.deny;
		basePermissions |= memberOverwrite.allow;
	}

	return basePermissions;
}
function computeChannelPermissions(guildId: string, channelId: string, memberId: string): bigint {
	return computeChannelOverwrites(computeBasePermissions(guildId, memberId), guildId, channelId, memberId);
}

export default new (class PermissionsStore extends Store {
	constructor() {
		super({
			CHANNEL_CREATE: (channel) => {
				if (!("permission_overwrites" in channel && channel.permission_overwrites)) return;

				const o: (typeof overwrites)[string] = {};
				for (const overwrite of channel.permission_overwrites) {
					o[overwrite.id] = {
						allow: BigInt(overwrite.allow),
						deny: BigInt(overwrite.deny),
						type: overwrite.type,
					};
				}
				setOverwrites(channel.id, o);
			},
			CHANNEL_DELETE: ({ id }) => {
				setOverwrites(produce((o) => delete o[id]));
			},
			CHANNEL_UPDATE: (channel) => {
				if (!("permission_overwrites" in channel && channel.permission_overwrites)) return;

				const o: (typeof overwrites)[string] = {};
				for (const overwrite of channel.permission_overwrites) {
					o[overwrite.id] = {
						allow: BigInt(overwrite.allow),
						deny: BigInt(overwrite.deny),
						type: overwrite.type,
					};
				}
				setOverwrites(channel.id, o);
			},
			GUILD_CREATE: (guild) => {
				if (guild.unavailable) return;
				batch(() => {
					for (const channel of guild.channels) {
						if (!("permission_overwrites" in channel)) continue;

						const o: (typeof overwrites)[string] = {};
						for (const overwrite of channel.permission_overwrites ?? []) {
							o[overwrite.id] = {
								allow: BigInt(overwrite.allow),
								deny: BigInt(overwrite.deny),
								type: overwrite.type,
							};
						}
						setOverwrites(channel.id, o);
					}
				});
			},
			GUILD_DELETE: ({ id, unavailable }) => {
				if (unavailable) return;
				setOverwrites(
					produce((o) => {
						for (const channelId of ChannelStore.getGuildChannels(id) ?? []) {
							delete o[channelId];
						}
					}),
				);
			},
			READY: ({ guilds }) => {
				batch(() => {
					for (const guild of guilds ?? []) {
						if (guild.unavailable) continue;

						for (const channel of guild.channels) {
							if (!("permission_overwrites" in channel)) continue;

							const o: (typeof overwrites)[string] = {};
							for (const overwrite of channel.permission_overwrites ?? []) {
								o[overwrite.id] = {
									allow: BigInt(overwrite.allow),
									deny: BigInt(overwrite.deny),
									type: overwrite.type,
								};
							}
							setOverwrites(channel.id, o);
						}
					}
				});
			},
		});
	}

	hasBit = hasBit;
	computeBasePermissions = computeBasePermissions;
	computeChannelOverwrites = computeChannelOverwrites;
	computeChannelPermissions = computeChannelPermissions;

	// eslint-disable-next-line solid/reactivity
	canIgnoreAdmin({
		memberId,
		toCheck,
		guildId,
		channelId,
		basePermissions,
	}: {
		basePermissions?: bigint;
		channelId?: string;
		guildId: string;
		memberId: string;
		toCheck: bigint;
	}): boolean {
		if (basePermissions === undefined) basePermissions = computeBasePermissions(guildId, memberId);
		const overwrites = channelId ? computeChannelOverwrites(basePermissions, guildId, channelId, memberId) : basePermissions;

		return hasBit(overwrites, toCheck);
	}

	// eslint-disable-next-line solid/reactivity
	can({
		basePermissions,
		channelId,
		guildId,
		memberId,
		toCheck,
	}: {
		basePermissions?: bigint;
		channelId?: string;
		guildId: string;
		memberId: string;
		toCheck: bigint;
	}): boolean {
		const guild = GuildStore.getGuild(guildId);
		if (!guild) return false;
		if (guild.owner_id === memberId) return true;

		if (basePermissions === undefined) basePermissions = computeBasePermissions(guildId, memberId);
		if (hasBit(basePermissions, permissions.ADMINISTRATOR)) return true;
		const overwrites = channelId ? computeChannelOverwrites(basePermissions, guildId, channelId, memberId) : basePermissions;

		return hasBit(overwrites, toCheck);
	}
})();
