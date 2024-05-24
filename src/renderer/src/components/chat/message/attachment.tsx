import { createMemo, createSignal, JSX, Match, Show, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Output } from "valibot";

import { attachmentFlags } from "@constants/message";
import _attachment from "@constants/schemata/message/attachment";

type attachment = Output<typeof _attachment>;

const MAX_WIDTH = 550;
const MAX_HEIGHT = 350;

export function maxDims(opts: { height?: number | null; width?: number | null }): { height: number; width: number } {
	if (!opts.width || !opts.height) return { height: 0, width: 0 };
	const ar = opts.width / opts.height;
	if (ar > 1) {
		const nw = Math.min(MAX_WIDTH, opts.width);
		return { height: Math.round(nw / ar), width: nw };
	} else {
		const nh = Math.min(MAX_HEIGHT, opts.height);
		return { height: nh, width: Math.round(nh * ar) };
	}
}

export function Attachment(props: attachment): JSX.Element {
	const isSpoilered = createMemo(() => props.flags && (props.flags & attachmentFlags.IS_SPOILER) === attachmentFlags.IS_SPOILER);
	const md = createMemo(() => maxDims({ height: props.height, width: props.width }));

	// TODO: alt text
	// TODO: get appropriate image size into link

	return (
		<Dynamic component={isSpoilered() ? Spoiler : "div"} class="message-attachment">
			<Switch fallback={"imagine this is an attachment" + JSON.stringify(props)}>
				<Match when={props.content_type?.startsWith("image/")}>
					<img src={props.proxy_url} width={md().width} height={md().height} alt={props.filename} />
				</Match>
			</Switch>
		</Dynamic>
	);
}

export function Spoiler(props: { children: JSX.Element; class?: string }): JSX.Element {
	const [open, setOpen] = createSignal(false);

	return (
		<div classList={{ [props.class || ""]: !!props.class, open: open(), "spoiler-item": true }} onClick={() => setOpen(true)}>
			<Show when={!open()}>
				<div class="spoiler-warning">
					<strong>SPOILER</strong>
				</div>
			</Show>
			<div class="spoiler-content-container" aria-hidden={!open()}>
				<div class="spoiler-content">{props.children}</div>
			</div>
		</div>
	);
}
