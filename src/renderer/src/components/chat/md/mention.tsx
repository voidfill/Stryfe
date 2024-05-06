import { ruleTypeGuard } from "./lib";
import { MentionBox } from "./util";

export const usermention = ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^<@!?(\d+)>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[1],
		};
	},
	element: (data) => {
		// TODO: make guild id context for message renderer or whatever
		return <MentionBox>@{data}</MentionBox>;
	},
	order: 25,
	requiredFirstCharacters: "<@",
});

export const othermention = ruleTypeGuard({
	doesMatch: (source) => {
		const all = ["@everyone", "@here"];
		for (const e of all) {
			if (source.startsWith(e)) {
				return {
					capture: e,
					data: e,
				};
			}
		}
		return null;
	},
	element: (data) => <MentionBox>{data}</MentionBox>,
	order: 25,
	requiredFirstCharacters: "@",
});
