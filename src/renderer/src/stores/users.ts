import { batch, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import assets from "@constants/assets";
import { userAvatarURL } from "@constants/images";
import { clan as _clan, user_self as _user_self } from "@constants/schemata/common";

import Store from ".";

type user_self = InferOutput<typeof _user_self>;

// maybe decoration? i dont plan on rendering it though
type storedUser = {
	avatar: string | null;
	bot: boolean;
	discriminator: string;
	display_name: string | null;
	public_flags: number;
	username: string;
};

export const [selfId, setSelfId] = createSignal<string>("");
const [users, setUsers] = createStore<{ [key: string]: storedUser }>({});
const [self, setSelf] = createStore<user_self | object>({});
const [clans, setClans] = createStore<{
	[userId: string]: {
		badge: string;
		guild_id: string;
		tag: string;
	};
}>({});

function intoStoredClan(clan: InferOutput<typeof _clan> & { identity_enabled: true }): { badge: string; guild_id: string; tag: string } {
	return {
		badge: clan.badge,
		guild_id: clan.identity_guild_id,
		tag: clan.tag,
	};
}

// TODO: this cannot be optimal....
function intoStoredUser<T extends { [key: string]: unknown } & { discriminator: string; username: string }>(user: T): storedUser {
	return {
		avatar: typeof user.avatar === "string" ? user.avatar : null,
		bot: typeof user.bot === "boolean" ? user.bot : false,
		discriminator: user.discriminator,
		display_name: typeof user.display_name === "string" ? user.display_name : typeof user.global_name === "string" ? user.global_name : null,
		public_flags: typeof user.public_flags === "number" ? user.public_flags : 0,
		username: user.username,
	};
}

// TODO: more events
export default new (class UserStore extends Store {
	constructor() {
		super({
			CHANNEL_CREATE: (channel) => {
				if (!("recipients" in channel)) return;
				setUsers(
					produce((s) => {
						for (const user of channel.recipients) {
							s[user.id] ??= intoStoredUser(user);
						}
					}),
				);
			},
			CHANNEL_RECIPIENT_ADD: ({ user }) => {
				setUsers(user.id, intoStoredUser(user));
				if (user.clan?.identity_enabled) setClans(user.id, intoStoredClan(user.clan));
			},
			GUILD_MEMBER_ADD: ({ user }) => {
				if (users[user.id]) return;
				setUsers(user.id, intoStoredUser(user));
				if (user.clan?.identity_enabled) setClans(user.id, intoStoredClan(user.clan));
			},
			GUILD_MEMBERS_CHUNK: ({ members }) => {
				if (!members?.length) return;
				batch(() => {
					setUsers(
						produce((s) => {
							for (const { user } of members) {
								s[user.id] ??= intoStoredUser(user);
							}
						}),
					);
				});
			},
			MESSAGE_CREATE: ({ author, referenced_message, mentions }) => {
				batch(() => {
					setUsers(
						produce((s) => {
							s[author.id] ??= intoStoredUser(author);
							for (const mention of mentions ?? []) s[mention.id] ??= intoStoredUser(mention);

							if (referenced_message) {
								s[referenced_message.author.id] ??= intoStoredUser(referenced_message.author);
								for (const mention of referenced_message.mentions ?? []) s[mention.id] ??= intoStoredUser(mention);
							}
						}),
					);
					setClans(
						produce((s) => {
							if (author.clan?.identity_enabled) s[author.id] ??= intoStoredClan(author.clan);
							if (referenced_message?.author.clan?.identity_enabled)
								s[referenced_message.author.id] ??= intoStoredClan(referenced_message.author.clan);
							for (const mention of mentions ?? []) if (mention.clan?.identity_enabled) s[mention.id] ??= intoStoredClan(mention.clan);
							for (const mention of referenced_message?.mentions ?? [])
								if (mention.clan?.identity_enabled) s[mention.id] ??= intoStoredClan(mention.clan);
						}),
					);
				});
			},
			MESSAGES_FETCH_SUCCESS: ({ messages }) => {
				if (!messages?.length) return;
				batch(() => {
					setUsers(
						produce((s) => {
							for (const message of messages) {
								s[message.author.id] ??= intoStoredUser(message.author);
								for (const mention of message.mentions ?? []) s[mention.id] ??= intoStoredUser(mention);

								if (message.referenced_message) {
									s[message.referenced_message.author.id] ??= intoStoredUser(message.referenced_message.author);
									for (const mention of message.referenced_message.mentions ?? []) s[mention.id] ??= intoStoredUser(mention);
								}
							}
						}),
					);
					setClans(
						produce((s) => {
							for (const { author, referenced_message, mentions } of messages) {
								if (author.clan?.identity_enabled) s[author.id] ??= intoStoredClan(author.clan);
								for (const mention of mentions ?? [])
									if (mention.clan?.identity_enabled) s[mention.id] ??= intoStoredClan(mention.clan);

								if (referenced_message) {
									if (referenced_message.author.clan?.identity_enabled)
										s[referenced_message.author.id] ??= intoStoredClan(referenced_message.author.clan);
									for (const mention of referenced_message.mentions ?? [])
										if (mention.clan?.identity_enabled) s[mention.id] ??= intoStoredClan(mention.clan);
								}
							}
						}),
					);
				});
			},
			READY: ({ user, users }) => {
				batch(() => {
					const display_name = user.display_name || user.global_name || null;
					setSelf({ ...user, display_name });
					if (user.clan?.identity_enabled) setClans(user.id, intoStoredClan(user.clan));

					setUsers(
						produce((s) => {
							for (const user of users ?? []) {
								s[user.id] = intoStoredUser(user);
							}
						}),
					);

					setClans(
						produce((s) => {
							for (const { clan, id } of users ?? []) {
								if (clan?.identity_enabled) s[id] = intoStoredClan(clan);
							}
						}),
					);
				});
			},
			USER_UPDATE: (user) => {
				setSelf(user);
				if (user.clan?.identity_enabled) setClans(user.id, intoStoredClan(user.clan));
			},
			VOICE_STATE_UPDATE: (vs) => {
				if (!("member" in vs && vs.member && !users[vs.user_id])) return;
				setUsers(vs.user_id, intoStoredUser(vs.member.user));
				if (vs.member.user.clan?.identity_enabled) setClans(vs.user_id, intoStoredClan(vs.member.user.clan));
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getSelfId(): string {
		return selfId();
	}

	getSelf(): user_self | undefined {
		return "id" in self ? self : undefined;
	}

	// eslint-disable-next-line solid/reactivity
	getUser(id: string): storedUser {
		return "id" in self && self.id === id ? ({ ...self, bot: false, public_flags: 0 } as storedUser) : users[id];
	}

	getAvatarUrl(id: string, size = 128, animated = false): string {
		const user = this.getUser(id);
		if (!user || !user.avatar) return this.getRandomAvatarUrl(id);
		animated = animated && user.avatar.startsWith("a_");

		return userAvatarURL(id, user.avatar, size, animated);
	}

	getRandomAvatarUrl(userId?: string): string {
		const index = userId ? Number(userId) % assets.avatars.length : Math.floor(Math.random() * assets.avatars.length);

		return `avatars/${assets.avatars[index]}`;
	}

	// eslint-disable-next-line solid/reactivity
	getClan(userId: string): { badge: string; guild_id: string; tag: string } | undefined {
		return clans[userId];
	}
})();
