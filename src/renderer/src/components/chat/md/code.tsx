import { onCleanup, onMount } from "solid-js";

import highlight, { unRegister } from "@modules/highlight";

import { ruleTypeGuard } from "./lib";

export const codeblock = ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^```(?:([a-z0-9_+\-.#]+?)\n)?\n*([^\n][^]*?)\n*```/i.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: { content: match[2], lang: match[1] || undefined },
		};
	},
	element: (data) => {
		let ref: HTMLElement;
		let id: string | null = null;
		onMount(() => {
			if (!data.lang) return;
			id = highlight(data.content, data.lang, (r) => {
				if (ref) ref.innerHTML = r;
			});
		});

		onCleanup(() => id && unRegister(id)); // just in case.

		return (
			<span class="md-codeblock">
				<pre>
					<code
						ref={
							// @ts-expect-error no
							ref
						}
					>
						{data.content}
					</code>
				</pre>
			</span>
		);
	},
	order: 4,
	requiredFirstCharacters: "```",
});

export const inlinecode = ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[2],
		};
	},
	element: (data) => <code class="md-inlinecode">{data}</code>,
	order: 23,
	requiredFirstCharacters: "`",
});
