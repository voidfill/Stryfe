import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import __voice_state from "@constants/schemata/guild/voicestate";

import { on } from "@modules/dispatcher";
import logger from "@modules/logger";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";

type storedVoiceState = DistributiveOmit<InferOutput<typeof __voice_state>, "member" | "guild_id"> & { guild_id: string | null };
function intoStored(voice_state: InferOutput<typeof __voice_state>): storedVoiceState {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { member, guild_id, ...rest } = voice_state;
	return { ...rest, guild_id: guild_id ?? null };
}

const [perSessionId, setPerSessionId] = createStore<{ [sessionId: string]: storedVoiceState }>({});
const [perChannel, setPerChannel] = createStore<{ [channelId: string]: { [userId: string]: string } }>({});
// guildId can be null for DMs
const [perGuild, setPerGuild] = createStore<{ [guildId: string]: { [userId: string]: string } }>({});

on("CALL_CREATE", (call) => {
	batch(() => {
		if (!perChannel[call.channel_id]) setPerChannel(call.channel_id, {});
		if (!perGuild[null as any as string]) setPerGuild(null as any as string, {});
		setPerSessionId(
			produce((prev) => {
				for (const vs of call.voice_states ?? []) {
					const s = intoStored(vs);
					s.guild_id = null;
					prev[vs.session_id] = s;
				}
			}),
		);
		setPerChannel(
			call.channel_id,
			produce((prev) => {
				for (const vs of call.voice_states ?? []) {
					prev[vs.user_id] = vs.session_id;
				}
			}),
		);
		setPerGuild(
			null as any as string,
			produce((prev) => {
				for (const vs of call.voice_states ?? []) {
					prev[vs.user_id] = vs.session_id;
				}
			}),
		);
	});
});

on("CALL_DELETE", ({ channel_id }) => {
	if (!perChannel[channel_id]?.length) return;
	batch(() => {
		const us = Object.entries(perChannel[channel_id]);
		setPerChannel(produce((prev) => delete prev[channel_id]));
		setPerGuild(
			null as any as string,
			produce((prev) => {
				for (const [userId] of us) {
					delete prev[userId];
				}
			}),
		);
		setPerSessionId(
			produce((prev) => {
				for (const [, sessionId] of us) {
					delete prev[sessionId];
				}
			}),
		);
	});
});

on("CHANNEL_DELETE", ({ id }) => {
	if (!perChannel[id]) return;
	batch(() => {
		const sessionIds = Object.values(perChannel[id]);
		setPerChannel(produce((prev) => delete prev[id]));

		setPerSessionId(
			produce((prev) => {
				for (const sessionId of sessionIds) {
					delete prev[sessionId];
				}
			}),
		);
	});
});

on("GUILD_CREATE", (guild) => {
	if (guild.unavailable) return;

	batch(() => {
		if (!perGuild[guild.id]) setPerGuild(guild.id, {});

		for (const vs of guild.voice_states ?? []) {
			const s = intoStored(vs);
			s.guild_id = guild.id;

			setPerSessionId(vs.session_id, s);
			setPerGuild(guild.id, vs.user_id, vs.session_id);
			if (!perChannel[vs.channel_id]) setPerChannel(vs.channel_id, {});
			setPerChannel(vs.channel_id, vs.user_id, vs.session_id);
		}
	});
});

on("GUILD_DELETE", ({ id, unavailable }) => {
	if (unavailable) return;
	if (!perGuild[id]) return;
	batch(() => {
		const sessionIds = Object.values(perGuild[id]);
		setPerGuild(
			produce((prev) => {
				delete prev[id];
			}),
		);

		const channelIds = new Set<string>();
		for (const sessionId of sessionIds) {
			const vs = perSessionId[sessionId];
			if (vs.channel_id) channelIds.add(vs.channel_id);
		}

		setPerChannel(
			produce((prev) => {
				for (const channelId of channelIds) {
					delete prev[channelId];
				}
			}),
		);
		setPerSessionId(
			produce((prev) => {
				for (const sessionId of sessionIds) {
					delete prev[sessionId];
				}
			}),
		);
	});
});

on("PASSIVE_UPDATE_V1", ({ voice_states, guild_id }) => {
	if (!voice_states?.length) return;
	if (!perGuild[guild_id]) setPerGuild(guild_id, {});
	batch(() => {
		for (const vs of voice_states) {
			const s = intoStored(vs);
			s.guild_id = guild_id;

			setPerSessionId(vs.session_id, s);
			if (!perChannel[vs.channel_id]) setPerChannel(vs.channel_id, {});
			setPerChannel(vs.channel_id, vs.user_id, vs.session_id);
			setPerGuild(guild_id, vs.user_id, vs.session_id);
		}
	});
});

on("READY_SUPPLEMENTAL", (data) => {
	batch(() => {
		for (const guild of data.guilds ?? []) {
			if (!perGuild[guild.id]) setPerGuild(guild.id, {});

			for (const vs of guild.voice_states ?? []) {
				const s = intoStored(vs);
				s.guild_id = guild.id;

				setPerSessionId(vs.session_id, s);
				setPerGuild(guild.id, vs.user_id, vs.session_id);
				if (!perChannel[vs.channel_id]) setPerChannel(vs.channel_id, {});
				setPerChannel(vs.channel_id, vs.user_id, vs.session_id);
			}
		}
	});
});

on("VOICE_STATE_UPDATE", (vs) => {
	batch(() => {
		// left channel
		if (vs.channel_id === null) {
			if (!perSessionId[vs.session_id]) return logger.log("VoiceStateStore: VOICE_STATE_UPDATE: session not found", vs);
			const { guild_id, channel_id, user_id, session_id } = perSessionId[vs.session_id];

			if (perGuild[guild_id as string])
				setPerGuild(
					guild_id as string,
					produce((prev) => delete prev[user_id]),
				);
			if (perChannel[channel_id])
				setPerChannel(
					channel_id,
					produce((prev) => delete prev[user_id]),
				);
			setPerSessionId(produce((prev) => delete prev[session_id]));
			return;
		}

		const old = perSessionId[vs.session_id];
		// switched channel
		if (old && old.channel_id !== vs.channel_id) {
			const { guild_id, channel_id } = old;
			if (perChannel[channel_id])
				setPerChannel(
					channel_id,
					produce((prev) => delete prev[vs.user_id]),
				);
			if (perGuild[guild_id as string])
				setPerGuild(
					guild_id as string,
					produce((prev) => delete prev[vs.user_id]),
				);
		}

		// @ts-expect-error we did check that channel_id is not null so this is okay.
		setPerSessionId(vs.session_id, intoStored(vs));

		if (!perChannel[vs.channel_id]) setPerChannel(vs.channel_id, {});
		setPerChannel(vs.channel_id, vs.user_id, vs.session_id);

		if (!perGuild[vs.guild_id as string]) setPerGuild(vs.guild_id as string, {});
		setPerGuild(vs.guild_id as string, vs.user_id, vs.session_id);
	});
});

export const getVoiceState = p((sessionId: string): storedVoiceState | undefined => perSessionId[sessionId]);

export const getSessionId = p((channelId: string, userId: string): string | undefined => perChannel[channelId]?.[userId]);

export const getSessionIdsForGuild = p((guildId: string | null): string[] => Object.values(perGuild[guildId as any as string] ?? {}));

export const getSessionIdsForChannel = p((channelId: string): string[] => Object.values(perChannel[channelId] ?? {}));

registerDebugStore("voicestates", {
	getSessionId,
	getSessionIdsForChannel,
	getSessionIdsForGuild,
	getVoiceState,
	state: { perChannel, perGuild, perSessionId },
});
