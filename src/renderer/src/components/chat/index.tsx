import { createEffect, createMemo, For, JSX, onMount, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import { ChannelTypes } from "@constants/channel";
import permissions from "@constants/permissions";

import Api from "@modules/api";

import ChannelStore from "@stores/channels";
import MessageStore from "@stores/messages";

import { usePermissionsContext } from "@components/common/permissionscontext";

import { useLocationContext } from "../common/locationcontext";
import Message from "./message";
import TextArea from "./textarea";
import Typing from "./typing";

export default function Chat(): JSX.Element {
	const location = useLocationContext();

	return (
		<div class="chat" style={{ display: "flex", "flex-direction": "column", "flex-grow": 1, height: "100%" }}>
			<LazyScroller around={location().messageId} channelId={location().channelId} guildId={location().guildId} />
			<TextArea />
			<Typing channelId={location().channelId} guildId={location().guildId} />
		</div>
	);
}

const [scrollPositions, setScrollPositions] = createStore<{ [key: string]: number }>({});

function LazyScroller(props: { around?: string; channelId: string; guildId?: string }): JSX.Element {
	let scrollRef: HTMLDivElement;

	let isFetching = false;
	let ticking = false,
		lastScrollY = 0;
	function onScroll(): void {
		lastScrollY = scrollRef?.scrollTop;
		if (!ticking) {
			ticking = true;
			window.requestAnimationFrame(() => {
				setScrollPositions({ [untrack(() => props.channelId)]: lastScrollY });
				ticking = false;
			});
		}
	}

	const channel = createMemo(() => ChannelStore.getChannel(props.channelId));
	const chunk = createMemo(() => MessageStore.getChunk(props.channelId, props.around));
	const pctx = usePermissionsContext();
	const canFetchMessages = createMemo(
		() =>
			(channel() && (channel()?.type === ChannelTypes.DM || channel()?.type === ChannelTypes.GROUP_DM)) ||
			pctx().can(permissions.READ_MESSAGE_HISTORY | permissions.VIEW_CHANNEL),
	);
	function hasBefore(id: string): boolean {
		const earliest = untrack(() => MessageStore.getEarliestMessageId(props.channelId));
		if (!earliest) return true;
		return BigInt(id) > BigInt(earliest);
	}
	function hasAfter(id: string): boolean {
		const latest = untrack(() => ChannelStore.getLastMessageId(props.channelId));
		if (!latest) return true;
		return BigInt(id) < BigInt(latest);
	}

	onMount(() => {
		createEffect(() => {
			const sp = scrollPositions[props.channelId] ?? 0;
			if (isFetching) return;

			if (scrollRef.scrollHeight + sp < 2 * scrollRef.clientHeight && chunk()?.length && hasBefore(chunk()?.[0] ?? "0")) {
				isFetching = true;
				Api.getMessages({ before: chunk()?.[0], channelId: props.channelId }).then(() => {
					isFetching = false;
				});
			} else if (Math.abs(sp) < scrollRef.clientHeight && chunk()?.length && hasAfter(chunk()?.[(chunk()?.length ?? 1) - 1] ?? "0")) {
				isFetching = true;

				Api.getMessages({ after: chunk()?.[(chunk()?.length ?? 1) - 1], channelId: props.channelId }).then(() => {
					isFetching = false;
				});
			}
		});

		createEffect(() => {
			props.channelId;
			untrack(() => {
				if (scrollPositions[props.channelId]) scrollRef.scrollTo(0, scrollPositions[props.channelId] ?? 0);
			});
		});

		createEffect(() => {
			props.channelId, props.around, chunk();
			if (isFetching) return;

			if (!chunk() && canFetchMessages()) {
				isFetching = true;
				Api.getMessages({ around: props.around, channelId: props.channelId }).then(() => {
					isFetching = false;
				});
			}
		});
	});

	return (
		<div
			class="scroller scroller-thin"
			// @ts-expect-error ref
			ref={scrollRef}
			onScroll={onScroll}
			style={{
				contain: "strict",
				display: "flex",
				"flex-direction": "column-reverse",
				"flex-grow": 1,
				"overflow-x": "hidden",
				"overflow-y": "auto",
				width: "100%",
			}}
		>
			<div class="messages-wrapper">
				<For each={chunk()}>{(id, i): JSX.Element => <Message id={id} prevId={chunk()?.[i() - 1]} />}</For>
			</div>
		</div>
	);
}
