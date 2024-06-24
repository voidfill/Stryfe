import { batch, createMemo } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import { InferOutput } from "valibot";

import { guildIconURL } from "@constants/images";
import { ready_guild_properties as _ready_guild_properties } from "@constants/schemata/guild";

import { on } from "@modules/dispatcher";
import logger from "@modules/logger";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";

type ready_guild_properties = InferOutput<typeof _ready_guild_properties>;

type stored_guild = DistributiveOmit<ready_guild_properties, "features" | "id"> & {
	joined_at: string;
	large: boolean;
	lazy: boolean;
};

const unavailableGuilds = new ReactiveSet<string>();
const features = new ReactiveMap<string, ReactiveSet<string>>();
const [guilds, setGuilds] = createStore<{
	[id: string]: stored_guild;
}>();
const guildIds = createMemo(() => Object.keys(guilds));

on("GUILD_CREATE", (guild) => {
	if (guild.unavailable) return void unavailableGuilds.add(guild.id);
	unavailableGuilds.delete(guild.id);

	const { features: f, ...rest } = guild.properties;
	features.set(guild.id, new ReactiveSet(f));
	setGuilds(
		guild.id,
		reconcile({
			joined_at: guild.joined_at,
			large: guild.large,
			lazy: guild.lazy,
			...rest,
		}),
	);

	if (guild.data_mode != "full") logger.warn(`Guild ${guild.id} was not sent in full mode!`, guild);
});

on("GUILD_DELETE", ({ id, unavailable }) => {
	if (unavailable) return void unavailableGuilds.add(id);

	unavailableGuilds.delete(id);
	features.delete(id);
	setGuilds(produce((guilds) => delete guilds[id]));
});

on("GUILD_UPDATE", ({ id, ...properties }) => {
	const { features: f, ...rest } = properties;
	features.set(id, new ReactiveSet(f));
	setGuilds(
		id,
		reconcile({
			joined_at: guilds[id]?.joined_at,
			large: guilds[id]?.large,
			lazy: guilds[id]?.lazy,
			...rest,
		}),
	);
});

on("READY", ({ guilds }) => {
	batch(() => {
		for (const guild of guilds ?? []) {
			if (guild.unavailable) {
				unavailableGuilds.add(guild.id);
				continue;
			}

			unavailableGuilds.delete(guild.id);
			const { features: f, ...rest } = guild.properties;
			features.set(guild.id, new ReactiveSet(f));
			setGuilds(
				guild.id,
				reconcile({
					joined_at: guild.joined_at,
					large: guild.large,
					lazy: guild.lazy,
					...rest,
				}),
			);

			if (guild.data_mode != "full") logger.warn(`Guild ${guild.id} was not sent in full mode!`, guild);
		}
	});
});

export const isUnavailable = p((guildId: string): boolean => unavailableGuilds.has(guildId));

export const getGuildIds = p((): string[] => guildIds());

export const getGuild = p((guildId: string): stored_guild | undefined => guilds[guildId]);

export const getIconUrl = p((guildId: string, size = 96, animated = false): string | undefined => {
	const guild = getGuild(guildId);
	if (!guild) return undefined;
	if (!guild.icon) return undefined;

	animated = animated && guild.icon.startsWith("a_") && features.get(guildId)!.has("ANIMATED_ICON");

	return guildIconURL(guildId, guild.icon, size, animated);
});

export const getAcronym = p((guildId: string): string | undefined => {
	const guild = getGuild(guildId);
	if (!guild) return undefined;
	if (!guild.name) return undefined;

	return guild.name
		.split(/\s+/g)
		.slice(0, 3)
		.map((word) => word[0])
		.join("");
});

export const hasFeature = p((guildId: string, feature: string): boolean => features.get(guildId)?.has(feature) ?? false);

export const getFeatures = p((guildId: string): string[] => Array.from(features.get(guildId) ?? []));

export const isOwner = p((guildId: string, userId: string): boolean => getGuild(guildId)?.owner_id === userId);

registerDebugStore("guilds", {
	getAcronym,
	getGuild,
	getGuildIds,
	getIconUrl,
	hasFeature,
	isOwner,
	isUnavailable,
	state: { features, guilds, unavailableGuilds },
});
