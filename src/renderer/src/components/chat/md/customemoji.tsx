import { ruleTypeGuard } from "./lib";
export default ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^<(a)?:(\w+):(\d+)>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: { animated: !!match[1], id: match[3], name: match[2] },
		};
	},
	element: (data) => {
		return <span>customemoji {data.name}</span>;
	},
	order: 4,
	requiredFirstCharacters: "<",
});
