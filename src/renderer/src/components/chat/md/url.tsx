import { ruleTypeGuard } from "./lib";

export default ruleTypeGuard({
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

		return (
			<span class="md-url" onClick={() => console.log("clicked", data)}>
				{data}
			</span>
		);
	},
	order: 16,
	requiredFirstCharacters: "http",
});
