import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";

import assets from "@constants/assets";

import Store from ".";

import { user_self as _user_self } from "@renderer/constants/schemata/common";
import { Output, set } from "valibot";

type user_self = Output<typeof _user_self>;

// maybe decoration? i dont plan on rendering it though
type storedUser = {
	avatar: string | null;
	bot: boolean;
	discriminator: string;
	display_name: string | null;
	public_flags: number;
	username: string;
};

const [users, setUsers] = createStore<{ [key: string]: storedUser }>({});
const [self, setSelf] = createStore<user_self | object>({});

// TODO: this cannot be optimal....
function intoStored<T extends { [key: string]: unknown } & { discriminator: string; username: string }>(user: T): storedUser {
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
			GUILD_MEMBER_ADD: ({ user }) => {
				if (users[user.id]) return;
				setUsers(user.id, intoStored(user));
			},
			GUILD_MEMBERS_CHUNK: ({ members }) => {
				if (!members.length) return;
				batch(() => {
					setUsers(
						produce((s) => {
							for (const { user } of members) {
								s[user.id] ??= intoStored(user);
							}
						}),
					);
				});
			},
			READY: ({ user, users }) => {
				batch(() => {
					setSelf(user);

					setUsers(
						produce((s) => {
							for (const user of users ?? []) {
								s[user.id] = intoStored(user);
							}
						}),
					);
				});
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getSelfId(): string | undefined {
		return "id" in self ? self.id : undefined;
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

		return `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${animated ? "gif" : "webp"}?size=${size}`;
	}

	getRandomAvatarUrl(userId?: string): string {
		const index = userId ? Number(userId) % assets.avatars.length : Math.floor(Math.random() * assets.avatars.length);

		return `avatars/${assets.avatars[index]}`;
	}
})();
