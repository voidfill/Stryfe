import { batch, createEffect, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { genericMessage as _genericMessage } from "@constants/schemata/message";

import Storage from "@modules/storage";

import Store from ".";

import { Output } from "valibot";

// Should probably prompt to reload when disabling this
export const [messageLoggerEnabled, setMessageLoggerEnabled] = createSignal(Storage.get("messageLoggerEnabled", false));
createEffect(() => {
	Storage.set("messageLoggerEnabled", messageLoggerEnabled());
});

type message = DistributiveOmit<Output<typeof _genericMessage>, "id" | "channel_id" | "author" | "member" | "mentions" | "message_reference"> & {
	author_id: string;
	mention_ids?: string[];
	message_reference?: string; // can only be in the same channel so might as well omit the rest
};

const [messages, setMessages] = createStore<{ [key: string]: message }>({});

export const enum MessageState {
	SENT,
	SENDING,
	SEND_FAILED,
	DELETED,
}
// TODO: add sending state logic and optimistic send functionality
const [messageState, setMessageState] = createStore<{ [key: string]: MessageState }>({});

const perChannel = new Map<string, Set<string>>();

export default new (class MessageStore extends Store {
	constructor() {
		super({
			CHANNEL_DELETE: ({ id }) => {
				batch(() => {
					for (const message_id of perChannel.get(id) ?? []) {
						setMessages(
							produce((messages) => {
								delete messages[message_id];
							}),
						);
					}
				});
			},
			// TODO: Thread delete
			MESSAGE_CREATE: (message) => {
				batch(() => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { id, channel_id, author, member, mentions, message_reference, referenced_message, ...rest } = message;
					setMessages(id, {
						...rest,
						author_id: author.id,
						mention_ids: mentions?.map((mention) => mention.id),
						message_reference: message_reference?.message_id,
					});
					if (perChannel.has(channel_id)) perChannel.get(channel_id)!.add(id);
					else perChannel.set(channel_id, new Set([id]));

					if (referenced_message) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { id, channel_id, author, member, mentions, message_reference, ...rest } = referenced_message;
						setMessages(referenced_message.id, {
							...rest,
							author_id: author.id,
							mention_ids: mentions?.map((mention) => mention.id),
							message_reference: message_reference?.message_id,
						});

						perChannel.get(channel_id)!.add(id);
					}
				});
			},
			MESSAGE_DELETE: (message) => {
				if (messageLoggerEnabled()) {
					setMessageState(message.id, MessageState.DELETED);
				} else {
					setMessages(
						produce((messages) => {
							delete messages[message.id];
						}),
					);
					perChannel.get(message.channel_id)?.delete(message.id);
					// TODO: Remove entry in list
				}
			},
			MESSAGE_DELETE_BULK: ({ channel_id, ids }) => {
				batch(() => {
					if (messageLoggerEnabled()) {
						for (const id of ids) {
							setMessageState(id, MessageState.DELETED);
						}
					} else {
						setMessages(
							produce((messages) => {
								for (const id of ids) {
									delete messages[id];
								}
							}),
						);
						for (const id of ids) {
							perChannel.get(channel_id)?.delete(id);
						}

						// TODO: remove entries in list
					}
				});
			},
			MESSAGE_UPDATE: (message) => {
				batch(() => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { id, channel_id, author, member, mentions, message_reference, ...rest } = message;
					setMessages(id, rest);
					if (mentions) {
						setMessages(
							id,
							"mention_ids",
							mentions.map((mention) => mention.id),
						);
					}
				});
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getMessage(id: string): message | undefined {
		return messages[id];
	}

	// eslint-disable-next-line solid/reactivity
	getMessageState(id: string): MessageState {
		return messageState[id] ?? MessageState.SENT;
	}
})();
