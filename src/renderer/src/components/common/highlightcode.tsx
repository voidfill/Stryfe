import { createEffect, JSX, onCleanup, onMount } from "solid-js";

import highlight, { unRegister } from "@modules/highlight";

export default function HighlightCodeBlock(props: { content: string; lang: string }): JSX.Element {
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
			<code ref={ref}>{props.content}</code>
		</pre>
	);
}
