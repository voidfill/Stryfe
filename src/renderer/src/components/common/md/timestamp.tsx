import { ruleTypeGuard } from "./lib";

export default ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^<t:(-?\d{1,17})(?::(t|T|d|D|f|F|R))?>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: { format: match[2], time: match[1] },
		};
	},
	element: (data) => {
		return (
			<span>
				timestamp {data.time} format {data.format}
			</span>
		);
	},
	order: 24,
	requiredFirstCharacters: "<t:",
});
