import { ruleTypeGuard } from "./lib";

export default ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^<@&(\d+)>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[1],
		};
	},
	element: (data) => <span>rolemention {data}</span>,
	order: 23,
	requiredFirstCharacters: "<@&",
});
