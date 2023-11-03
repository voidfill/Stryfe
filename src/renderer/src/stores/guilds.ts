import { batch, createMemo } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";

import { ready_guild_properties as _ready_guild_properties } from "@constants/schemata/guild";

import logger from "@modules/logger";

import Store from ".";

import { Output } from "valibot";

type ready_guild_properties = Output<typeof _ready_guild_properties>;

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

export default new (class GuildStore extends Store {
	constructor() {
		super({
			GUILD_CREATE: (guild) => {
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
			},
			GUILD_DELETE: ({ id, unavailable }) => {
				if (unavailable) {
					return void unavailableGuilds.add(id);
				}
				unavailableGuilds.delete(id);
				features.delete(id);
				setGuilds(produce((guilds) => delete guilds[id]));
			},
			GUILD_UPDATE: ({ id, ...properties }) => {
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
			},
			READY: ({ guilds }) => {
				batch(() => {
					for (const guild of guilds) {
						if (guild.unavailable) {
							unavailableGuilds.add(guild.id);
							continue;
						}
						unavailableGuilds.delete(guild.id);
						features.set(guild.id, new ReactiveSet(guild.properties.features));
						setGuilds(
							guild.id,
							reconcile({
								joined_at: guild.joined_at,
								large: guild.large,
								lazy: guild.lazy,
								...guild.properties,
							}),
						);

						if (guild.data_mode != "full") logger.warn(`Guild ${guild.id} was not sent in full mode!`, guild);
					}
				});
			},
		});
	}

	isUnavailable(guildId: string): boolean {
		return unavailableGuilds.has(guildId);
	}

	// eslint-disable-next-line solid/reactivity
	get guildIds(): string[] {
		return guildIds();
	}

	// eslint-disable-next-line solid/reactivity
	getGuild(guildId: string): stored_guild | undefined {
		return guilds[guildId];
	}

	getIconUrl(guildId: string, size = 96, animated = false): string | undefined {
		const guild = this.getGuild(guildId);
		if (!guild) return undefined;
		if (!guild.icon) return undefined;

		animated = animated && guild.icon.startsWith("a_") && features.get(guildId)!.has("ANIMATED_ICON");

		return `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.${animated ? "gif" : "webp"}?size=${size}`;
	}

	getAcronym(guildId: string): string | undefined {
		const guild = this.getGuild(guildId);
		if (!guild) return undefined;
		if (!guild.name) return undefined;

		return guild.name
			.split(/\s+/g)
			.slice(0, 3)
			.map((word) => word[0])
			.join("");
	}

	hasFeature(guildId: string, feature: string): boolean {
		return features.get(guildId)?.has(feature) ?? false;
	}
})();
