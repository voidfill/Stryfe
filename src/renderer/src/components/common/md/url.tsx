import { JSX } from "solid-js";

import { openOutgoingLink } from "../modals/outgoinglink";
import { ruleTypeGuard } from "./lib";

function El(url: string): JSX.Element {
	return (
		<span class="md-url" onClick={() => openOutgoingLink(url)}>
			{url}
		</span>
	);
}

export const url = ruleTypeGuard({
	doesMatch: (source, state) => {
		if (!state.inline) return null;
		const match = /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[1],
		};
	},
	element: (data, _, state) => {
		if (state.inSpoiler) {
			state.outputData.spoilers ??= {};
			state.outputData.spoilers[data] = true;
		}

		return El(data);
	},
	order: 16,
	requiredFirstCharacters: "http",
});

export const autolink = ruleTypeGuard({
	doesMatch: (source, state) => {
		if (!state.inline) return null;
		const match = /^<([^: >]+:\/[^ >]+)>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[1],
		};
	},
	element: (data) => El(data),
	order: 16,
	requiredFirstCharacters: "<",
});
