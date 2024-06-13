import { createEffect, JSX, onCleanup, onMount, Show } from "solid-js";

import highlight, { unRegister } from "@modules/highlight";

import { FaRegularCopy } from "solid-icons/fa";

export default function HighlightCodeBlock(props: { content: string; copy?: boolean; lang?: string; ref?: (r: HTMLElement) => void }): JSX.Element {
	let ref: HTMLElement | undefined;
	let id: string | null = null;

	onMount(() => {
		createEffect(() => {
			if (!props.lang) return;
			id = highlight(props.content, props.lang, (r) => {
				if (ref) ref.innerHTML = r;
			});
		});

		onCleanup(() => id && unRegister(id));
	});

	return (
		<pre style={{ position: "relative" }}>
			<code
				ref={(r) => {
					ref = r;
					props.ref?.(r);
				}}
				style={{
					"background-color": "var(--code-background-color)",
					border: "1px solid #181818",
					"border-radius": "4px",
					display: "block",
					overflow: "hidden",
					padding: "0.5em",
					"user-select": "text",
					"white-space": "pre-wrap",
					"word-wrap": "break-word",
				}}
			>
				{props.content}
			</code>
			<Show when={props.copy}>
				<FaRegularCopy
					style={{
						cursor: "pointer",
						position: "absolute",
						right: "0.5em",
						top: "0.5em",
					}}
					onClick={() => navigator.clipboard.writeText(props.content)}
				/>
			</Show>
		</pre>
	);
}
