import { createEffect, JSX, onCleanup, onMount } from "solid-js";

import highlight, { unRegister } from "@modules/highlight";

export default function HighlightCodeBlock(props: { content: string; lang?: string; ref?: (r: HTMLElement) => void }): JSX.Element {
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
		<pre>
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
					padding: "0.5em",
					"user-select": "text",
					"white-space": "pre-wrap",
				}}
			>
				{props.content}
			</code>
		</pre>
	);
}
