import { batch, untrack } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { boolean, fallback, InferOutput } from "valibot";

import { genericMessage as _genericMessage } from "@constants/schemata/message";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";
import { persistSignal } from "@modules/persist";

import { registerDebugStore } from ".";

// sorted low to high
type chunk = string[];
// chunks sorted by first entry's id, descending
// [["5", "6"], ["3", "4"], ["1", "2"]]
const [perChannel, setPerChannel] = createStore<{ [key: string]: chunk[] }>({});
const perChannelUnordered = new Map<string, Set<string>>();

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
			while (perChannel[channelId][insertIndex]?.length && BigInt(perChannel[channelId][insertIndex][0]) > BigInt(messageIds[0])) {
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
export const [messageLoggerEnabled, setMessageLoggerEnabled] = persistSignal("messageLoggerEnabled", fallback(boolean(), false));

// it might happen that we accidentally store some of the omitted values in here since spread operator is funny but its important that we mark them as not accessible
type message = DistributiveOmit<
	InferOutput<typeof _genericMessage>,
	"id" | "channel_id" | "author" | "member" | "mentions" | "message_reference" | "embeds"
> & {
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

const [earliestMessageId, setEarliestMessageId] = createStore<{ [key: string]: string }>({});

on("CHANNEL_DELETE", ({ id }) => {
	batch(() => {
		setMessages(
			produce((messages) => {
				for (const message_id of perChannelUnordered.get(id) ?? []) {
					delete messages[message_id];
				}
			}),
		);
		perChannelUnordered.delete(id);
		setPerChannel(produce((perChannel) => delete perChannel[id]));
	});
});

on("MESSAGE_CREATE", (message) => {
	batch(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, channel_id, author, member, mentions, message_reference, referenced_message, ...rest } = message;
		setMessages(id, {
			...rest,
			author_id: author.id,
			mention_ids: mentions?.map((mention) => mention.id),
			message_reference: message_reference?.message_id,
		});
		if (!perChannelUnordered.has(channel_id)) perChannelUnordered.set(channel_id, new Set());

		if (referenced_message) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, channel_id, author, mentions, message_reference, ...rest } = referenced_message;
			setMessages(referenced_message.id, {
				...rest,
				author_id: author.id,
				mention_ids: mentions?.map((mention) => mention.id),
				message_reference: message_reference?.message_id,
			});
			perChannelUnordered.get(channel_id)!.add(referenced_message.id);
		}

		perChannelUnordered.get(channel_id)!.add(id);
		addMessage(channel_id, id);
	});
});

on("MESSAGE_DELETE", (message) => {
	if (!messages[message.id]) return;
	if (messageLoggerEnabled()) {
		setMessageState(message.id, MessageState.DELETED);
	} else {
		setMessages(
			produce((messages) => {
				delete messages[message.id];
			}),
		);
		perChannelUnordered.get(message.channel_id)?.delete(message.id);
		removeEntry(message.channel_id, message.id);
	}
});

on("MESSAGE_DELETE_BULK", ({ channel_id, ids }) => {
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
				perChannelUnordered.get(channel_id)?.delete(id);
			}

			removeEntries(channel_id, new Set(ids));
		}
	});
});

on("MESSAGE_UPDATE", (message) => {
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
});

on("MESSAGES_FETCH_SUCCESS", ({ messages, channelId, after, around, before, limit }) => {
	if (!messages.length) return;
	const messageIds = messages.map((m) => m.id).reverse();

	batch(() => {
		if (!perChannelUnordered.has(channelId)) perChannelUnordered.set(channelId, new Set(messageIds));
		else for (const id of messageIds) perChannelUnordered.get(channelId)!.add(id);

		if (!after && limit && messageIds.length < limit) setEarliestMessageId(channelId, messageIds[0]);

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

				perChannelUnordered.get(channel_id)!.add(id);
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
});

on("THREAD_DELETE", ({ id }) => {
	batch(() => {
		setMessages(
			produce((messages) => {
				for (const message_id of perChannelUnordered.get(id) ?? []) {
					delete messages[message_id];
				}
			}),
		);
		perChannelUnordered.delete(id);
	});
});

export const getMessage = p((id: string): message | undefined => messages[id]);

export const getMessageState = p((id: string): MessageState => messageState[id] ?? MessageState.SENT);

export const getEarliestMessageId = p((channelId: string): string | undefined => earliestMessageId[channelId]);

export const getChunk = p((channelId: string, around?: string): chunk | undefined => {
	const chunks = perChannel[channelId];
	if (!chunks) return undefined;
	if (!around) return chunks[0];
	return chunks.find((chunk) => BigInt(chunk[0]) <= BigInt(around) && BigInt(chunk[chunk.length - 1]) >= BigInt(around));
});

registerDebugStore("messages", {
	getChunk,
	getEarliestMessageId,
	getMessage,
	getMessageState,
	state: { messageState, messages, perChannel, perChannelUnordered },
});
