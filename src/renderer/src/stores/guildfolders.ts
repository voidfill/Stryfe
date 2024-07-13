import { createStore, produce } from "solid-js/store";
import { boolean, fallback, record, string } from "valibot";

import { on } from "@modules/dispatcher";
import { persistStore } from "@modules/persist";

import { registerDebugStore } from ".";
import { getGuild, getGuildIds } from "./guilds";

import { PreloadedUserSettings_GuildFolder } from "discord-protos";

type GuildFolder = {
	color?: number;
	guildIds: string[];
	isGuild: boolean;
	name?: string;
};

export const [guildFolders, setGuildFolders] = createStore<Record<string, GuildFolder>>({});
export const [orderedFolderIds, setOrderedFolderIds] = createStore<string[]>([]);
export const [openFolders, setOpenFolders] = persistStore(
	"openFolders",
	fallback(record(string(), boolean()), {}),
	// since the default is true, we filter out the true values
	(v) => Object.fromEntries(Object.entries(v).filter(([, v]) => !v)),
);

export function removeFromFolder(folderId: string, guildId: string): void {
	if (!guildFolders[folderId]) return;
	setGuildFolders(folderId, "guildIds", (p) => p.filter((id) => id !== guildId));
	if (guildFolders[folderId].guildIds.length === 0) {
		setGuildFolders(
			produce((p) => {
				delete p[folderId];
			}),
		);
		setOrderedFolderIds((p) => p.filter((id) => id !== folderId));
	}
}

export function addToFolder(folderId: string, guildId: string, position?: number): void {
	if (!guildFolders[folderId]) return;
	position ??= guildFolders[folderId].guildIds.length;
	setGuildFolders(
		folderId,
		"guildIds",
		produce((p) => {
			p.splice(position, 0, guildId);
		}),
	);
}

function intoRecord(data: PreloadedUserSettings_GuildFolder[]): Record<string, GuildFolder> {
	return Object.fromEntries(
		data.map(({ color, guildIds, id, name }) => [
			String(id ? id.value : guildIds[0]),
			{
				color: color ? Number(color.value) : undefined,
				guildIds: guildIds.map(String),
				isGuild: !id,
				name: name ? name.value : undefined,
			},
		]),
	);
}

function intoArray(data: PreloadedUserSettings_GuildFolder[]): string[] {
	return data.map(({ id, guildIds }) => String(id ? id.value : guildIds[0]));
}

export function setupGuildFolders(data: PreloadedUserSettings_GuildFolder[]): void {
	setGuildFolders(intoRecord(data));

	const all = new Set(getGuildIds());
	for (const f of data) for (const id of f.guildIds) all.delete(String(id));
	setOrderedFolderIds([
		...[...all].sort((a, b) => {
			const aa = getGuild(a),
				bb = getGuild(b);
			if (!aa || !bb) return 0;
			return new Date(aa.joined_at).valueOf() - new Date(bb.joined_at).valueOf();
		}),
		...intoArray(data),
	]);
}

export function intoProto(): PreloadedUserSettings_GuildFolder[] {
	return orderedFolderIds.map((id) => {
		const f = guildFolders[id];
		if (!f) throw new Error(`No folder with id ${id}`);
		if (f.isGuild) return { guildIds: [BigInt(id)] };
		return {
			color: f.color ? { value: BigInt(f.color) } : undefined,
			guildIds: f.guildIds.map(BigInt),
			id: { value: BigInt(id) },
			name: f.name ? { value: f.name } : undefined,
		};
	});
}

on("READY", ({ guilds }) => {
	setGuildFolders(
		produce((p) => {
			for (const { id } of guilds ?? []) {
				if (!p[id]) p[id] = { guildIds: [id], isGuild: true };
			}
		}),
	);
	setOrderedFolderIds(guilds?.map((g) => g.id) ?? []);
});

on("GUILD_CREATE", ({ id }) => {
	// check if became available again
	for (const folderId of orderedFolderIds) if (guildFolders[folderId].guildIds.includes(id)) return;

	setGuildFolders(id, { guildIds: [id], isGuild: true });
	setOrderedFolderIds((p) => [id, ...p]);
});

on("GUILD_DELETE", ({ id, unavailable }) => {
	if (unavailable) return;

	let foundIn: string | undefined;
	for (const folderId of orderedFolderIds) {
		if (guildFolders[folderId].guildIds.includes(id)) {
			foundIn = folderId;
			break;
		}
	}
	if (!foundIn) return;

	removeFromFolder(foundIn, id);
});

registerDebugStore("guildFolders", {
	addToFolder,
	intoProto,
	removeFromFolder,
	setupGuildFolders,
	state: {
		guildFolders,
		openFolders,
		orderedFolderIds,
	},
});
