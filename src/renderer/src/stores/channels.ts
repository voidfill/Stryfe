import { batch, createSignal, untrack } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import { InferOutput } from "valibot";

import assets from "@constants/assets";
import { ChannelTypes } from "@constants/channel";
import { channelIconURL } from "@constants/images";
import { guild_channel } from "@constants/schemata/channels";
import { thread } from "@constants/schemata/thread";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";
import { getAvatarUrl, getUser } from "./users";

const lastMessageIds = new ReactiveMap<string, string | undefined>();
const lastPinTimestamps = new ReactiveMap<string, string | undefined>();

const [guildChannels, setGuildChannels] = createStore<{
	[channelId: string]: DistributiveOmit<
		InferOutput<typeof guild_channel>,
		"id" | "last_message_id" | "last_pin_timestamp" | "permission_overwrites"
	> & {
		guild_id: string;
		parent_id?: string | null;
	};
}>({});

const channelsPerGuild = new ReactiveMap<string, ReactiveSet<string>>();
const sortedGuildChannels = new ReactiveMap<
	string,
	{
		categorized: {
			id: string;
			other: string[];
			voice: string[];
		}[];
		uncategorized: {
			other: string[];
			voice: string[];
		};
	}
>();
const scheduledChannelSorts = new Map<string, NodeJS.Timeout>();

function sortGuildChannels(guildId: string): (typeof sortedGuildChannels extends ReactiveMap<any, infer V> ? V : never) | undefined {
	let categorized: {
		id: string;
		other: string[];
		voice: string[];
	}[] = [];
	let uncategorized = {
		other: [] as string[],
		voice: [] as string[],
	};

	untrack(() => {
		if (!channelsPerGuild.has(guildId)) return undefined;
		const channelIds = channelsPerGuild.get(guildId)!;

		// on most guilds, all channel positions are unique. if discord fucked up, we fall back. returns true on fail
		function fastSort(): boolean {
			const voice: Map<
				number,
				{
					id: string;
					parent: string | null;
				}
			> = new Map();
			let voiceLast = 0;
			const other: Map<
				number,
				{
					id: string;
					parent: string | null;
				}
			> = new Map();
			let otherLast = 0;
			const categories: Map<string, number> = new Map();
			const categoryCounter = new Set<number>();

			for (const channelId of channelIds ?? []) {
				const channel = guildChannels[channelId];
				if (channel.type === ChannelTypes.GUILD_CATEGORY) {
					categories.set(channelId, channel.position);
					categoryCounter.add(channel.position);
				} else if (channel.type === ChannelTypes.GUILD_VOICE || channel.type === ChannelTypes.GUILD_STAGE_VOICE) {
					voice.set(channel.position, {
						id: channelId,
						parent: channel.parent_id ?? null,
					});
					if (channel.position > voiceLast) {
						voiceLast = channel.position;
					}
				} else {
					other.set(channel.position, {
						id: channelId,
						parent: channel.parent_id ?? null,
					});
					if (channel.position > otherLast) {
						otherLast = channel.position;
					}
				}
			}

			// check if all the positions were unique
			if (channelIds.size !== categoryCounter.size + voice.size + other.size) {
				return true; // failure
			}

			for (const [channelId, position] of categories) {
				categorized[position] = {
					id: channelId,
					other: [],
					voice: [],
				};
			}
			for (let i = 0; i <= otherLast; i++) {
				const el = other.get(i);
				if (!el) continue; // channel got deleted i presume

				if (el.parent === null) {
					uncategorized.other.push(el.id);
				} else {
					categorized[categories.get(el.parent)!].other.push(el.id);
				}
			}
			for (let i = 0; i <= voiceLast; i++) {
				const el = voice.get(i);
				if (!el) continue;

				if (el.parent === null) {
					uncategorized.voice.push(el.id);
				} else {
					categorized[categories.get(el.parent)!].voice.push(el.id);
				}
			}
			categorized = categorized.filter((c) => c);
			uncategorized.other = uncategorized.other.filter((c) => c);
			uncategorized.voice = uncategorized.voice.filter((c) => c);
			return false; // yay!
		}
		function slowSort(): void {
			const cats = new Map<
				string,
				{
					other: [string, number][]; // [id, position]
					position: number;
					voice: [string, number][]; // [id, position]
				}
			>();
			const uncat = {
				other: [] as [string, number][],
				voice: [] as [string, number][],
			};

			for (const channelId of channelIds) {
				const channel = guildChannels[channelId];
				if (channel.type !== ChannelTypes.GUILD_CATEGORY) continue;
				cats.set(channelId, {
					other: [],
					position: channel.position,
					voice: [],
				});
			}

			for (const channelId of channelIds) {
				const channel = guildChannels[channelId];
				if (channel.type === ChannelTypes.GUILD_CATEGORY) continue;

				if (channel.type === ChannelTypes.GUILD_VOICE || channel.type === ChannelTypes.GUILD_STAGE_VOICE) {
					if (channel.parent_id) {
						cats.get(channel.parent_id)?.voice.push([channelId, channel.position]);
					} else {
						uncat.voice.push([channelId, channel.position]);
					}
				} else {
					if (channel.parent_id) {
						cats.get(channel.parent_id)?.other.push([channelId, channel.position]);
					} else {
						uncat.other.push([channelId, channel.position]);
					}
				}
			}

			categorized = Array.from(cats.entries())
				.map(([key, el]) => ({
					id: key,
					other: el.other.sort((a, b) => a[1] - b[1]).map((a) => a[0]),
					position: el.position,
					voice: el.voice.sort((a, b) => a[1] - b[1]).map((a) => a[0]),
				}))
				.sort((a, b) => a.position - b.position)
				.map(({ id, other, voice }) => ({
					id,
					other,
					voice,
				}));
			uncategorized = {
				other: uncat.other.sort((a, b) => a[1] - b[1]).map((a) => a[0]),
				voice: uncat.voice.sort((a, b) => a[1] - b[1]).map((a) => a[0]),
			};
		}
		if (fastSort()) slowSort();
	});

	return {
		categorized,
		uncategorized,
	};
}

function scheduleChannelSort(guildId: string): void {
	if (scheduledChannelSorts.has(guildId)) clearTimeout(scheduledChannelSorts.get(guildId)!);
	scheduledChannelSorts.set(
		guildId,
		setTimeout(() => {
			const sorted = sortGuildChannels(guildId);
			if (sorted) return void sortedGuildChannels.set(guildId, sorted);
			throw "channel sort failed";
		}, 250),
	);
}
function removeSortedGuildChannel(channelId: string): void {
	const channel = guildChannels[channelId];
	if (!channel) return;
	const sc = sortedGuildChannels.get(channelId);
	if (!sc) return;

	if (channel.type === ChannelTypes.GUILD_CATEGORY) {
		const index = sc.categorized.findIndex((c) => c.id === channelId);
		if (!index) throw "category not found";
		const spliced = sc.categorized.splice(
			sc.categorized.findIndex((c) => c.id === channelId),
			1,
		)[0];
		sc.uncategorized.other.push(...spliced.other);
		sc.uncategorized.voice.push(...spliced.voice);
	} else {
		const parentId = guildChannels[channelId].parent_id;
		if (parentId) {
			const parent = sc.categorized.find((c) => c.id === parentId);
			if (!parent) throw "parent not found";

			if (channel.type === ChannelTypes.GUILD_VOICE || channel.type === ChannelTypes.GUILD_STAGE_VOICE) {
				parent.voice = parent.voice.filter((c) => c !== channelId);
			} else {
				parent.other = parent.other.filter((c) => c !== channelId);
			}
		} else {
			if (channel.type === ChannelTypes.GUILD_VOICE || channel.type === ChannelTypes.GUILD_STAGE_VOICE) {
				sc.uncategorized.voice = sc.uncategorized.voice.filter((c) => c !== channelId);
			} else {
				sc.uncategorized.other = sc.uncategorized.other.filter((c) => c !== channelId);
			}
		}
	}

	sortedGuildChannels.set(channelId, { ...sc });
}

const [directMessages, setDirectMessages] = createStore<{
	[channelId: string]: {
		flags: number;
		recipient_ids: string[];
	} & (
		| {
				is_spam?: boolean;
				type: ChannelTypes.DM;
		  }
		| {
				icon: string | null;
				name: string | null;
				owner_id: string;
				type: ChannelTypes.GROUP_DM;
		  }
	);
}>({});
const [orderedDirectMessages, setOrderedDirectMessages] = createSignal<[string, bigint][]>([]);
const soDMs = (a: [string, bigint], b: [string, bigint]): number => Number(b[1] - a[1]);
function orderedDMIndex(bigint: bigint): number {
	const s = orderedDirectMessages();
	let low = 0,
		mid: number,
		high = s.length;
	while (low < high) {
		mid = (low + high) >>> 1;
		if (s[mid][1] > bigint) low = mid + 1;
		else high = mid;
	}
	return low;
}
const [dmForUser, setDMForUser] = createStore<{
	[userId: string]: string;
}>({});

const [threads, setThreads] = createStore<{
	[channelId: string]: DistributiveOmit<InferOutput<typeof thread>, "id">;
}>({});
const threadsPerChannel = new ReactiveMap<string, ReactiveSet<string>>();

on("CHANNEL_CREATE", (channel) => {
	batch(() => {
		// @ts-expect-error only undefined in categories, dont care.
		lastMessageIds.set(channel.id, channel.last_message_id || channel.id);
		// @ts-expect-error ^
		lastPinTimestamps.set(channel.id, channel.last_pin_timestamp || undefined);

		if ("guild_id" in channel) {
			if (!channelsPerGuild.has(channel.guild_id)) {
				channelsPerGuild.set(channel.guild_id, new ReactiveSet());
			}
			channelsPerGuild.get(channel.guild_id)!.add(channel.id);
			// @ts-expect-error we dont use the nonexistant ones.
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, last_pin_timestamp, last_message_id, permission_overwrites, ...rest } = channel;
			setGuildChannels(id, reconcile(rest));
			return scheduleChannelSort(channel.guild_id);
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, recipients, last_pin_timestamp, last_message_id, ...rest } = channel;
		setDirectMessages(id, {
			...rest,
			recipient_ids: recipients.map((r) => r.id),
		});
		if (channel.type === ChannelTypes.DM && !dmForUser[channel.recipients[0].id]) {
			setDMForUser(channel.recipients[0].id, channel.id);
		}

		const index = orderedDMIndex(BigInt(channel.last_message_id || channel.id));
		setOrderedDirectMessages((old) => {
			old.splice(index, 0, [channel.id, BigInt(channel.last_message_id || channel.id)]);
			return [...old];
		});
	});
});

on("CHANNEL_DELETE", (channel) => {
	batch(() => {
		const id = channel.id;
		if ("guild_id" in channel) {
			if (threadsPerChannel.has(id)) {
				setThreads(
					produce((threads) => {
						for (const threadId of threadsPerChannel.get(id)!) {
							delete threads[threadId];
						}
					}),
				);
			}
			removeSortedGuildChannel(id);
			channelsPerGuild.get(channel.guild_id)?.delete(id);
			setGuildChannels(produce((channels) => delete channels[id]));
			lastMessageIds.delete(id);
			lastPinTimestamps.delete(id);
			return;
		}
		const type = directMessages[id]?.type;
		if (type === ChannelTypes.DM) {
			setDMForUser(produce((dms) => delete dms[directMessages[id].recipient_ids[0]]));
		}
		setOrderedDirectMessages((old) => old.filter((dm) => dm[0] !== id));
		setDirectMessages(produce((channels) => delete channels[id]));
		lastMessageIds.delete(id);
		lastPinTimestamps.delete(id);
	});
});

on("CHANNEL_PINS_UPDATE", ({ channel_id, last_pin_timestamp }) => {
	lastPinTimestamps.set(channel_id, last_pin_timestamp || undefined);
});

on("CHANNEL_UPDATE", (channel) => {
	batch(() => {
		if ("guild_id" in channel) {
			const old = guildChannels[channel.id];
			if (
				old &&
				sortedGuildChannels.get(channel.guild_id) &&
				// @ts-expect-error parent_id doesnt exist on categories but thats ok, loose equal for undefined/null
				(old.position != channel.position || old.parent_id != channel.parent_id)
			)
				scheduleChannelSort(channel.guild_id);

			// @ts-expect-error dont worry about it
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, last_pin_timestamp, last_message_id, permission_overwrites, ...rest } = channel;
			setGuildChannels(id, reconcile(rest));
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, last_pin_timestamp, last_message_id, recipients, ...rest } = channel;
		setDirectMessages(id, reconcile({ ...rest, recipient_ids: recipients.map((r) => r.id) }));
	});
});

on("GUILD_CREATE", (guild) => {
	if (guild.unavailable) return;
	batch(() => {
		channelsPerGuild.set(guild.id, new ReactiveSet(guild.channels.map((c) => c.id)));
		for (const channel of guild.channels) {
			// @ts-expect-error dont worry about it
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, last_pin_timestamp, last_message_id, permission_overwrites, ...rest } = channel;
			setGuildChannels(id, { ...rest, guild_id: guild.id });
			channelsPerGuild.get(guild.id)!.add(id);
			lastMessageIds.set(channel.id, last_message_id || undefined);
			lastPinTimestamps.set(channel.id, last_pin_timestamp || undefined);
		}

		for (const thread of guild.threads ?? []) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, member, ...rest } = thread;
			setThreads(id, rest);
			lastMessageIds.set(id, rest.last_message_id || undefined);
			lastPinTimestamps.set(id, rest.last_pin_timestamp || undefined);
		}
	});
});

on("GUILD_DELETE", ({ id, unavailable }) => {
	if (unavailable) return;
	batch(() => {
		if (!channelsPerGuild.has(id)) return;
		for (const channelId of channelsPerGuild.get(id)!) {
			lastMessageIds.delete(channelId);
			lastPinTimestamps.delete(channelId);
			setGuildChannels(produce((channels) => delete channels[channelId]));

			if (threadsPerChannel.get(channelId))
				setThreads(
					produce((s) => {
						for (const threadId of threadsPerChannel.get(channelId)!) {
							delete s[threadId];
						}
					}),
				);
		}
		channelsPerGuild.delete(id);
		sortedGuildChannels.delete(id);
	});
});

on("MESSAGE_CREATE", ({ channel_id, id }) => {
	batch(() => {
		if (directMessages[channel_id]) {
			setOrderedDirectMessages((old) => {
				const beforeLast = lastMessageIds.get(channel_id);
				const oldItem = beforeLast && old[orderedDMIndex(BigInt(beforeLast))];
				if (oldItem && oldItem[0] !== channel_id) throw ":( not sure what to say, something bad happened";

				return [oldItem || [channel_id, BigInt(id)], ...old.filter((dm) => dm[0] !== channel_id)];
			});
		}
		lastMessageIds.set(channel_id, id);
	});
});

on("PASSIVE_UPDATE_V2", ({ updated_channels }) => {
	batch(() => {
		for (const channel of updated_channels ?? []) {
			lastMessageIds.set(channel.id, channel.last_message_id || channel.id);
			if (channel.last_pin_timestamp) lastPinTimestamps.set(channel.id, channel.last_pin_timestamp);
		}
	});
});

on("READY", ({ guilds, private_channels }) => {
	batch(() => {
		for (const guild of guilds ?? []) {
			if ("unavailable" in guild && guild.unavailable) continue;
			channelsPerGuild.set(guild.id, new ReactiveSet(guild.channels.map((c) => c.id)));
			for (const channel of guild.channels) {
				// @ts-expect-error this is okay since we || undefined
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, last_pin_timestamp, last_message_id, permission_overwrites, ...rest } = channel;
				setGuildChannels(id, { ...rest, guild_id: guild.id });
				channelsPerGuild.get(guild.id)!.add(id);
				lastMessageIds.set(channel.id, last_message_id || undefined);
				lastPinTimestamps.set(channel.id, last_pin_timestamp || undefined);
			}

			for (const thread of guild.threads ?? []) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, member, last_message_id, ...rest } = thread;
				setThreads(id, rest);
				lastMessageIds.set(id, last_message_id || undefined);
				lastPinTimestamps.set(id, rest.last_pin_timestamp || undefined);
			}
		}

		if (private_channels) {
			setOrderedDirectMessages(private_channels.map((c) => [c.id, BigInt(c.last_message_id || c.id)] as [string, bigint]).sort(soDMs));
			for (const channel of private_channels) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, last_pin_timestamp, last_message_id, ...rest } = channel;
				setDirectMessages(id, {
					...rest,
				});
				lastMessageIds.set(id, last_message_id || id);
				lastPinTimestamps.set(id, last_pin_timestamp || undefined);
				if (channel.type === ChannelTypes.DM) {
					setDMForUser(channel.recipient_ids[0], channel.id);
				}
			}
		}
	});
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
on("THREAD_CREATE", ({ id, guild_id, last_message_id, last_pin_timestamp, member, newly_created, member_ids_preview, ...rest }) => {
	batch(() => {
		if (!threadsPerChannel.has(rest.parent_id)) threadsPerChannel.set(rest.parent_id, new ReactiveSet());
		threadsPerChannel.get(rest.parent_id)!.add(id);
		setThreads(id, rest);
		lastMessageIds.set(id, last_message_id || undefined);
		lastPinTimestamps.set(id, last_pin_timestamp || undefined);
	});
});

on("THREAD_DELETE", ({ id, parent_id }) => {
	batch(() => {
		threadsPerChannel.get(parent_id)?.delete(id);
		setThreads(produce((threads) => delete threads[id]));
		lastMessageIds.delete(id);
		lastPinTimestamps.delete(id);
	});
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
on("THREAD_UPDATE", ({ id, parent_id, last_message_id, last_pin_timestamp, member, ...rest }) => {
	batch(() => {
		setThreads(id, rest);
		lastMessageIds.set(id, last_message_id || undefined);
		lastPinTimestamps.set(id, last_pin_timestamp || undefined);
		if (!threadsPerChannel.has(parent_id)) threadsPerChannel.set(parent_id, new ReactiveSet());
		threadsPerChannel.get(parent_id)!.add(id);
	});
});

export const getLastMessageId = p((channelId: string) => lastMessageIds.get(channelId));

export const getLastPinTimestamp = p((channelId: string) => lastPinTimestamps.get(channelId));

export const getOrderedDirectMessages = p(() => orderedDirectMessages());

export const getDirectMessage = p((channelId: string): (typeof directMessages)[string] | undefined => directMessages[channelId]);

export const getPrivateChannelName = p((channelId: string): string | undefined => {
	const channel = getDirectMessage(channelId);
	if (!channel) return undefined;
	if (channel.type === ChannelTypes.DM) {
		const user = getUser(channel.recipient_ids[0]);
		return user && (user.display_name || user.username);
	}
	return (
		channel.name ||
		channel.recipient_ids
			.map((id) => {
				const user = getUser(id);
				return user && (user.display_name || user.username);
			})
			.join(", ")
	);
});

export const getRandomGroupIconUrl = p((channelId?: string): string => {
	const index = channelId ? Number(channelId) % assets.groupIcons.length : Math.floor(Math.random() * assets.groupIcons.length);
	return "groupicons/" + assets.groupIcons[index];
});

export const getPrivateChannelIcon = p((channelId: string, size = 128, animate = false): string => {
	const channel = getDirectMessage(channelId);
	if (!channel) throw "channel not found";

	if (channel.type === ChannelTypes.DM) {
		return getAvatarUrl(channel.recipient_ids[0], size, animate);
	}
	if (channel.icon) {
		return channelIconURL(channelId, channel.icon, size);
	}

	return getRandomGroupIconUrl(channelId);
});

export const getGuildChannel = p((channelId: string): (typeof guildChannels)[string] | undefined => guildChannels[channelId]);

// These functions purely exist as typeguards. They use getGuildChannel to still be reasonably patchable
export const getGuildCategoryChannel = p((channelId: string) => {
	const channel = getGuildChannel(channelId);
	if (!channel) return undefined;
	if (channel?.type !== ChannelTypes.GUILD_CATEGORY) throw "Requested channel is not a category (typeguard)";
	return channel;
});
export const getGuildVoiceChannel = p((channelId: string) => {
	const channel = getGuildChannel(channelId);
	if (!channel) return undefined;
	if (channel?.type !== ChannelTypes.GUILD_VOICE && channel?.type !== ChannelTypes.GUILD_STAGE_VOICE)
		throw "Requested channel is not a voice channel (typeguard)";
	return channel;
});
export const getGuildTextChannel = p((channelId: string) => {
	const channel = getGuildChannel(channelId);
	if (!channel) return undefined;
	if (
		channel?.type !== ChannelTypes.GUILD_TEXT &&
		channel?.type !== ChannelTypes.GUILD_ANNOUNCEMENT &&
		channel?.type !== ChannelTypes.GUILD_DIRECTORY &&
		channel?.type !== ChannelTypes.GUILD_FORUM &&
		channel?.type !== ChannelTypes.GUILD_MEDIA
	)
		throw "Requested channel is not a text channel (typeguard)";
	return channel;
});

export const getGuildChannels = p((guildId: string): IterableIterator<string> | undefined => {
	const s = channelsPerGuild.get(guildId);
	if (!s) return undefined;
	return s.values();
});

export const getSortedGuildChannels = p((guildId: string): (typeof sortedGuildChannels extends ReactiveMap<any, infer V> ? V : never) | undefined => {
	if (!channelsPerGuild.has(guildId)) return undefined;
	if (sortedGuildChannels.has(guildId)) return sortedGuildChannels.get(guildId)!;

	if (scheduledChannelSorts.has(guildId)) clearTimeout(scheduledChannelSorts.get(guildId)!);
	const sorted = sortGuildChannels(guildId);
	if (sorted) sortedGuildChannels.set(guildId, sorted);
	return sorted;
});

export const hasThreads = p((channelId: string): boolean => threadsPerChannel.has(channelId) && (threadsPerChannel.get(channelId)?.size ?? 0) > 0);

export const getThread = p((threadId: string): (typeof threads)[string] | undefined => threads[threadId]);

export const getChannel = p((channelId: string) => getGuildChannel(channelId) || getDirectMessage(channelId) || getThread(channelId));

export const getDMForUser = p((userId: string): string | undefined => dmForUser[userId]);

export const getChannelName = p((channelId: string): string | undefined => {
	const c = getChannel(channelId);
	if (!c) return undefined;
	if ("name" in c && c.name) return c.name;
	if (c.type === ChannelTypes.DM || c.type === ChannelTypes.GROUP_DM) return getPrivateChannelName(channelId);
	return undefined;
});

registerDebugStore("channels", {
	getChannel,
	getChannelName,
	getDMForUser,
	getDirectMessage,
	getGuildCategoryChannel,
	getGuildChannel,
	getGuildChannels,
	getGuildTextChannel,
	getGuildVoiceChannel,
	getLastMessageId,
	getLastPinTimestamp,
	getOrderedDirectMessages,
	getPrivateChannelIcon,
	getPrivateChannelName,
	getRandomGroupIconUrl,
	getSortedGuildChannels,
	getThread,
	hasThreads,
	state: {
		channelsPerGuild,
		directMessages,
		dmForUser,
		guildChannels,
		lastMessageIds,
		lastPinTimestamps,
		orderedDirectMessages,
		sortedGuildChannels,
		threads,
		threadsPerChannel,
	},
});
