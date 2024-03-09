import { batch, createEffect, createSignal, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Output } from "valibot";

import { genericMessage as _genericMessage } from "@constants/schemata/message";

import Storage from "@modules/storage";

import Store from ".";

// sorted low to high
type chunk = string[];
// chunks sorted by first entry's id, descending
// [["5", "6"], ["3", "4"], ["1", "2"]]
const [perChannel, setPerChannel] = createStore<{ [key: string]: chunk[] }>({});

const enum MessageFetchType {
	AROUND,
	BEFORE,
	AFTER,
	INITIAL,
}

function mergeUnique(a: chunk, b: chunk): chunk {
	const s = new Set(a);
	return a.concat(b.filter((e) => !s.has(e)));
}

function addMessages(channelId: string, messageIds: string[], messageFetchType: MessageFetchType, relativeTo?: string): void {
	batch(() =>
		untrack(() => {
			if (messageFetchType === MessageFetchType.INITIAL) {
				setPerChannel(channelId, [messageIds]);
				return;
			}

			if (!perChannel[channelId]) setPerChannel(channelId, []);

			let insertIndex = 1;
			while (perChannel[channelId][insertIndex] && BigInt(perChannel[channelId][insertIndex][0]) > BigInt(messageIds[0])) {
				insertIndex++;
			}

			setPerChannel(
				channelId,
				produce((chunks) => {
					chunks.splice(insertIndex, 0, messageIds);
				}),
			);

			switch (messageFetchType) {
				case MessageFetchType.AFTER: {
					if (!relativeTo) throw new Error("relativeTo must be provided for MessageFetchType.AFTER");
					const afterChunk = perChannel[channelId][insertIndex + 1];
					if (!afterChunk || afterChunk[0] !== relativeTo) throw new Error("relativeTo not found in chunk");
					setPerChannel(
						channelId,
						produce((chunks) => {
							chunks.splice(insertIndex, 2, mergeUnique(afterChunk, messageIds));
						}),
					);

					const beforeChunk = perChannel[channelId][insertIndex - 1];
					if (beforeChunk && BigInt(beforeChunk[beforeChunk.length - 1]) > BigInt(messageIds[0])) {
						setPerChannel(
							channelId,
							produce((chunks) => {
								chunks.splice(insertIndex - 1, 2, mergeUnique(messageIds, beforeChunk));
							}),
						);
					}
					return;
				}
				case MessageFetchType.BEFORE: {
					if (!relativeTo) throw new Error("relativeTo must be provided for MessageFetchType.BEFORE");
					const beforeChunk = perChannel[channelId][insertIndex - 1];
					if (!beforeChunk || beforeChunk[0] !== relativeTo) {
						console.log(relativeTo, beforeChunk, perChannel[channelId]);
						throw new Error("relativeTo not found in chunk");
					}
					setPerChannel(
						channelId,
						produce((chunks) => {
							chunks.splice(insertIndex - 1, 2, mergeUnique(messageIds, beforeChunk));
						}),
					);

					const afterChunk = perChannel[channelId][insertIndex + 1];
					if (afterChunk && BigInt(afterChunk[0]) < BigInt(messageIds[messageIds.length - 1])) {
						setPerChannel(
							channelId,
							produce((chunks) => {
								chunks.splice(insertIndex, 2, mergeUnique(afterChunk, messageIds));
							}),
						);
					}
					return;
				}
				case MessageFetchType.AROUND: {
					const beforeChunk = perChannel[channelId][insertIndex - 1];
					if (beforeChunk && BigInt(beforeChunk[beforeChunk.length - 1]) > BigInt(messageIds[0])) {
						setPerChannel(
							channelId,
							produce((chunks) => {
								chunks.splice(insertIndex - 1, 2, mergeUnique(messageIds, beforeChunk));
							}),
						);
					}
					const afterChunk = perChannel[channelId][insertIndex + 1];
					if (afterChunk && BigInt(afterChunk[0]) < BigInt(messageIds[messageIds.length - 1])) {
						setPerChannel(
							channelId,
							produce((chunks) => {
								chunks.splice(insertIndex, 2, mergeUnique(afterChunk, messageIds));
							}),
						);
					}
					return;
				}
			}
		}),
	);
}

function addMessage(channelId: string, messageId: string): void {
	untrack(() => {
		if (!perChannel[channelId]) return void setPerChannel(channelId, [[messageId]]);
		setPerChannel(
			channelId,
			produce((chunks) => {
				if (!Array.isArray(chunks[0])) return void (chunks[0] = [messageId]);
				chunks[0].push(messageId);
			}),
		);
	});
}

function updateMessageId(channelId: string, oldMessageId: string, newMessageId: string): void {
	for (const chunk of untrack(() => perChannel[channelId] ?? [])) {
		const foundIndex = untrack(() => chunk.findIndex((entry) => entry === oldMessageId));
		if (!~foundIndex) continue;
		setPerChannel(channelId, perChannel[channelId].indexOf(chunk), foundIndex, newMessageId);
		break;
	}
	throw new Error("oldMessageId not found");
}

function removeEntries(channelId: string, messageIds: Set<string>): void {
	if (untrack(() => !perChannel[channelId] || !perChannel[channelId].length)) return;
	setPerChannel(
		channelId,
		produce((chunks) => chunks.map((chunk) => chunk.filter((id) => !messageIds.has(id))).filter((chunk) => chunk.length)),
	);
}

function removeEntry(channelId: string, messageId: string): void {
	if (untrack(() => !perChannel[channelId] || !perChannel[channelId].length)) return;
	setPerChannel(
		channelId,
		produce((chunks) => {
			for (const chunk of chunks) {
				const index = chunk.indexOf(messageId);
				if (~index) {
					chunk.splice(index, 1);
					if (!chunk.length) chunks.splice(chunks.indexOf(chunk), 1);
					return;
				}
			}
		}),
	);
}

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

const __perChannel = new Map<string, Set<string>>();

export default new (class MessageStore extends Store {
	constructor() {
		super({
			CHANNEL_DELETE: ({ id }) => {
				batch(() => {
					setMessages(
						produce((messages) => {
							for (const message_id of __perChannel.get(id) ?? []) {
								delete messages[message_id];
							}
						}),
					);
					__perChannel.delete(id);
				});
			},
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
					if (__perChannel.has(channel_id)) __perChannel.get(channel_id)!.add(id);
					else __perChannel.set(channel_id, new Set([id]));

					if (referenced_message) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { id, channel_id, author, mentions, message_reference, ...rest } = referenced_message;
						setMessages(referenced_message.id, {
							...rest,
							author_id: author.id,
							mention_ids: mentions?.map((mention) => mention.id),
							message_reference: message_reference?.message_id,
						});

						__perChannel.get(channel_id)!.add(id);
					}

					addMessage(channel_id, id);
				});
			},
			MESSAGE_DELETE: (message) => {
				if (!messages[message.id]) return;
				if (messageLoggerEnabled()) {
					setMessageState(message.id, MessageState.DELETED);
				} else {
					setMessages(
						produce((messages) => {
							delete messages[message.id];
						}),
					);
					__perChannel.get(message.channel_id)?.delete(message.id);
					removeEntry(message.channel_id, message.id);
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
							__perChannel.get(channel_id)?.delete(id);
						}

						removeEntries(channel_id, new Set(ids));
					}
				});
			},
			MESSAGE_UPDATE: (message) => {
				batch(() => {
					if (!messages[message.id]) return;
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
			MESSAGES_FETCH_SUCCESS: ({ messages, channelId, after, around, before }) => {
				const messageIds = messages.map((m) => m.id).reverse();

				batch(() => {
					if (!__perChannel.has(channelId)) __perChannel.set(channelId, new Set());
					for (const id of messageIds) __perChannel.get(channelId)!.add(id);

					for (const message of messages) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { id, channel_id, author, mentions, message_reference, referenced_message, ...rest } = message;
						setMessages(id, {
							...rest,
							author_id: author.id,
							mention_ids: mentions?.map((mention) => mention.id),
							message_reference: message_reference?.message_id,
						});

						if (referenced_message) {
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							const { id, channel_id, author, mentions, message_reference, ...rest } = referenced_message;
							setMessages(referenced_message.id, {
								...rest,
								author_id: author.id,
								mention_ids: mentions?.map((mention) => mention.id),
								message_reference: message_reference?.message_id,
							});

							__perChannel.get(channel_id)!.add(id);
						}
					}

					const messageFetchType = after
						? MessageFetchType.AFTER
						: before
						? MessageFetchType.BEFORE
						: around
						? MessageFetchType.AROUND
						: MessageFetchType.INITIAL;
					addMessages(channelId, messageIds, messageFetchType, after ?? before ?? around);
				});
			},
			THREAD_DELETE: ({ id }) => {
				batch(() => {
					setMessages(
						produce((messages) => {
							for (const message_id of __perChannel.get(id) ?? []) {
								delete messages[message_id];
							}
						}),
					);
					__perChannel.delete(id);
				});
			},
		});
	}

	perChannel = perChannel;

	// eslint-disable-next-line solid/reactivity
	getMessage(id: string): message | undefined {
		return messages[id];
	}

	// eslint-disable-next-line solid/reactivity
	getMessageState(id: string): MessageState {
		return messageState[id] ?? MessageState.SENT;
	}

	// TODO: actual message type, validator?
	createMessage(channel_id: string, content: string): void {
		// get "fake" message id: nonce as either last message in that channel + 1 or Date.now() as snowflake
		// add to sending set
		// add to messages store
		// add to messages list
		//
		// make request
		// if fail, set state to failed
		// else
		// remove from sending set
		// remove from messages store and set under new id
		// update message list entry with new id
	}

	// eslint-disable-next-line solid/reactivity
	getChunk(channelId: string, around?: string): chunk | undefined {
		const chunks = perChannel[channelId];
		if (!chunks) return undefined;
		if (!around) return chunks[0];
		return chunks.find((chunk) => BigInt(chunk[0]) <= BigInt(around) && BigInt(chunk[chunk.length - 1]) >= BigInt(around));
	}
})();
