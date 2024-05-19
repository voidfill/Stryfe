import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";
import { Output } from "valibot";

import { attachmentFlags } from "@constants/message";
import _attachment from "@constants/schemata/message/attachment";

import MessageStore from "@stores/messages";

type attachment = Output<typeof _attachment>;

const MAX_WIDTH = 550;
const MAX_HEIGHT = 350;

export function Attachments(props: { messageId: string }): JSX.Element {
	const attachments = createMemo(() => MessageStore.getMessage(props.messageId)?.attachments ?? []);

	return (
		<Show when={attachments}>
			<div class="message-attachments">
				<For each={attachments()}>{Attachment}</For>
			</div>
		</Show>
	);
}

export function Attachment(props: attachment): JSX.Element {
	const nw = createMemo(() => {
		if (!props.width || !props.height) return 0;
		const ar = props.width / props.height;
		if (ar > 1) return Math.min(MAX_WIDTH, props.width);
		return Math.round(Math.min(MAX_HEIGHT, props.height) * ar);
	});
	const nh = createMemo(() => {
		if (!props.width || !props.height) return 0;
		const ar = props.width / props.height;
		if (ar > 1) return Math.round(Math.min(MAX_WIDTH, props.width) / ar);
		return Math.min(MAX_HEIGHT, props.height);
	});

	return (
		<div class="message-attachment">
			<Switch fallback={"imagine this is an attachment" + JSON.stringify(props)}>
				<Match when={props.content_type?.startsWith("image/")}>
					<img src={props.proxy_url} alt={props.filename} width={nw()} height={nh()} />
				</Match>
			</Switch>
		</div>
	);
}
