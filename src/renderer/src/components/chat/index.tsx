import { useLocation, useParams } from "@solidjs/router";
import { createEffect, createMemo, For, JSX, onMount, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import permissions from "@constants/permissions";

import Api from "@modules/api";

import ChannelStore from "@stores/channels";
import MessageStore from "@stores/messages";
import { hasBit } from "@stores/permissions";

import { usePermissionsContext } from "@components/common/permissionscontext";

import { useLocationContext } from "../common/locationcontext";
import Message from "./message";

export default function Chat(): JSX.Element {
	const params = useParams();

	return (
		<div class="chat" style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
			<LazyScroller around={params.messageId} channelId={params.channelId} guildId={params.guildId} />
			<TextArea />
		</div>
	);
}

function TextArea(): JSX.Element {
	const location = useLocationContext();
	const channelName = createMemo(() =>
		location().guildId === "@me"
			? "@" + ChannelStore.getPrivateChannelName(location().channelId)
			: "#" + ChannelStore.getGuildChannel(location().channelId)?.name,
	);

	return (
		<div class="text-area">
			<textarea placeholder={`Message ${channelName() ?? "#unknown-channel"}`} style={{ all: "unset" }} />
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

	const chunk = createMemo(() => MessageStore.getChunk(props.channelId, props.around));
	const pctx = usePermissionsContext();
	const canFetchMessages = createMemo(() => hasBit(pctx().channel, permissions.READ_MESSAGE_HISTORY));
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
			// @ts-expect-error yea yea.
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
