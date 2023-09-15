import { createStore, produce } from "solid-js/store";
import Store from ".";
import { batch } from "solid-js";

const [typing, setTyping] = createStore<{
	[channelId: string]: {
		[userId: string]: number;
	};
}>({});
const timeouts = new Map<string, NodeJS.Timeout>();

export default new (class TypingStore extends Store {
	constructor() {
		super({
			MESSAGE_CREATE: ({ channel_id, author }) => {
				if (!typing[channel_id]) return;
				const key = `${channel_id}:${author.id}`;
				if (timeouts.has(key)) {
					clearTimeout(timeouts.get(key)!);
					timeouts.delete(key);
				}
				setTyping(
					channel_id,
					produce((v) => delete v[author.id]),
				);
			},
			TYPING_START: ({ channel_id, user_id, timestamp }) => {
				batch(() => {
					if (!typing[channel_id]) setTyping(channel_id, {});
					setTyping(channel_id, user_id, timestamp);

					const key = `${channel_id}:${user_id}`;
					if (timeouts.has(key)) clearTimeout(timeouts.get(key)!);
					timeouts.set(
						key,
						setTimeout(() => {
							setTyping(
								channel_id,
								produce((v) => {
									delete v[user_id];
								}),
							);
							timeouts.delete(key);
						}, 10000),
					);
				});
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getTyping(channelId: string): [string, number][] {
		return (typing[channelId] && Object.entries(typing[channelId])) || [];
	}

	// eslint-disable-next-line solid/reactivity
	isTypingInChannel(channelId: string, userId: string): boolean {
		return !!typing[channelId]?.[userId];
	}
})();
