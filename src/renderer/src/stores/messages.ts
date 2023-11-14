import { batch, createEffect, createSignal, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { genericMessage as _genericMessage } from "@constants/schemata/message";

import Storage from "@modules/storage";

import Store from ".";

import { Output } from "valibot";

// [fake-ish sorting id, message id] sorted low to high
type chunk = [bigint, string][];
const [perChannel, setPerChannel] = createStore<{ [key: string]: chunk[] }>({});

export const enum MessageFetchType {
	AROUND,
	BEFORE,
	AFTER,
}

// TODO: make sure we only insert into the chunk that is actually the current one. mark somehow?
function addMessage(channelId: string, messageId: string): void {
	const entry = [BigInt(messageId), messageId] as [bigint, string];
	if (untrack(() => !perChannel[channelId] || !perChannel[channelId].length)) return void setPerChannel(channelId, [[entry]]);
	setPerChannel(channelId, perChannel[channelId].length - 1, (chunk) => [...chunk, entry]);
}
function addMessages(channelId: string, messageIds: string[], messageFetchType: MessageFetchType): void {
	const newChunk = messageIds.map((messageId) => [BigInt(messageId), messageId] as [bigint, string]);
	if (untrack(() => !perChannel[channelId] || !perChannel[channelId].length)) {
		return void setPerChannel(channelId, [newChunk]);
	}

	let insertPosition = 0;
	setPerChannel(
		channelId,
		produce((chunks) => {
			while (insertPosition < chunks.length && (chunks[insertPosition][0]?.[0] ?? 0) < newChunk[0][0]) insertPosition++;
			chunks.splice(insertPosition, 0, newChunk);
			return chunks;
		}),
	);

	// TODO: merge chunks if they either overlap or are linked with alignTo

	switch (messageFetchType) {
		case MessageFetchType.AROUND: {
			if (insertPosition !== 0) {
				// merge chunk with previous chunk if possible
			}

			if (insertPosition === untrack(() => perChannel[channelId].length) - 1) break;

			// check if mergeable with next chunk
			break;
		}
		case MessageFetchType.BEFORE: {
			if (insertPosition !== untrack(() => perChannel[channelId].length) - 1) {
				setPerChannel(
					channelId,
					produce((chunks) => {
						const insertedChunk = chunks.splice(insertPosition, 1)[0];
						chunks[insertPosition].unshift(...insertedChunk);
						return chunks;
					}),
				);
			}

			// check if previous chunk can be merged?
			if (insertPosition === 0) break;

			break;
		}
		case MessageFetchType.AFTER: {
			if (insertPosition !== 0) {
				setPerChannel(
					channelId,
					produce((chunks) => {
						const insertedChunk = chunks.splice(insertPosition, 1)[0];
						chunks[insertPosition - 1].push(...insertedChunk);
						return chunks;
					}),
				);
				insertPosition--;
			}

			// check if next chunk can be merged?
			if (
				insertPosition === untrack(() => perChannel[channelId].length) - 1 ||
				BigInt(messageIds.at(-1)!) < BigInt(untrack(() => perChannel[channelId][insertPosition + 1][0][1]))
			)
				break;

			// merge chunk with next chunk
			setPerChannel(
				channelId,
				produce((chunks) => {
					const chunk = chunks.splice(insertPosition, 1)[0];
					const chunkIdsSet = new Set(chunk.map(([, id]) => id));

					const nextChunk = chunks.splice(insertPosition + 1, 1)[0];
					const nextChunkIdsSet = new Set(nextChunk.map(([, id]) => id));

					chunks.splice(insertPosition, 0, [
						...chunk.filter(([, id]) => !nextChunkIdsSet.has(id)),
						...nextChunk.filter(([, id]) => !chunkIdsSet.has(id)),
					]);
					return chunks;
				}),
			);
		}
	}
}
function updateMessageId(channelId: string, oldMessageId: string, newMessageId: string): void {
	for (const chunk of untrack(() => perChannel[channelId] ?? [])) {
		const foundIndex = untrack(() => chunk.findIndex((entry) => entry[1] === oldMessageId));
		if (!~foundIndex) continue;
		setPerChannel(channelId, perChannel[channelId].indexOf(chunk), foundIndex, (entry) => [entry[0], newMessageId] as [bigint, string]);
		break;
	}
}
function removeEntries(channelId: string, messageIds: Set<string>): void {
	if (untrack(() => !perChannel[channelId] || !perChannel[channelId].length)) return;
	setPerChannel(
		channelId,
		produce((chunks) => chunks.map((chunk) => chunk.filter(([, id]) => !messageIds.has(id))).filter((chunk) => chunk.length)),
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

const sending = new Set<string>();

const ___perChannel = new Map<string, Set<string>>();

export default new (class MessageStore extends Store {
	constructor() {
		super({
			CHANNEL_DELETE: ({ id }) => {
				batch(() => {
					setMessages(
						produce((messages) => {
							for (const message_id of ___perChannel.get(id) ?? []) {
								delete messages[message_id];
							}
						}),
					);
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
					if (___perChannel.has(channel_id)) ___perChannel.get(channel_id)!.add(id);
					else ___perChannel.set(channel_id, new Set([id]));

					if (referenced_message) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { id, channel_id, author, member, mentions, message_reference, ...rest } = referenced_message;
						setMessages(referenced_message.id, {
							...rest,
							author_id: author.id,
							mention_ids: mentions?.map((mention) => mention.id),
							message_reference: message_reference?.message_id,
						});

						___perChannel.get(channel_id)!.add(id);
					}
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
					___perChannel.get(message.channel_id)?.delete(message.id);
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
							___perChannel.get(channel_id)?.delete(id);
						}

						// TODO: remove entries in list
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
})();
