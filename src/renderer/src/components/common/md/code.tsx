import { Show } from "solid-js";

import HighlightCodeBlock from "../highlightcode";
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
	element: (data, _, state) => (
		<Show when={!state.formatInline} fallback={<code class="md-inlinecode">{data.content}</code>}>
			<HighlightCodeBlock content={data.content} lang={data.lang} copy />
		</Show>
	),
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
