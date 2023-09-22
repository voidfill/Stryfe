import { batch } from "solid-js";
import { createStore } from "solid-js/store";

import assets from "@constants/assets";

import Store from ".";

import { user_self } from "@renderer/constants/gatewaytypes";

// maybe decoration? i dont plan on rendering it though
type storedUser = {
	avatar: string | null;
	bot: boolean;
	discriminator: string;
	global_name: string | null;
	public_flags: number;
	username: string;
};

const [users, setUsers] = createStore<{ [key: string]: storedUser }>({});
const [self, setSelf] = createStore<user_self | object>({});

export default new (class UserStore extends Store {
	constructor() {
		super({
			READY: ({ user, users }) => {
				batch(() => {
					setSelf(user);

					for (const user of users) {
						const { avatar, bot, discriminator, global_name, public_flags, username } = user;
						setUsers(user.id, {
							avatar,
							bot,
							discriminator,
							global_name,
							public_flags,
							username,
						});
					}
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
		return "id" in self && self.id === id ? (self as storedUser) : users[id];
	}

	getAvatarUrl(id: string, size = 128, animated = false): string {
		const user = this.getUser(id);
		if (!user || !user.avatar) return this.getRandomAvatarUrl(id);
		animated = animated && user.avatar.startsWith("a_");

		return `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${animated ? "gif" : "png"}?size=${size}`;
	}

	getRandomAvatarUrl(userId?: string): string {
		const index = userId ? Number(userId) % assets.avatars.length : Math.floor(Math.random() * assets.avatars.length);

		return `/avatars/${assets.avatars[index]}`;
	}
})();
