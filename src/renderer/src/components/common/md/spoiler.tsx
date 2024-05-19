import { createSignal } from "solid-js";

import { ruleTypeGuard } from "./lib";

export default ruleTypeGuard({
	doesMatch: (source) => {
		const match = /^\|\|([\s\S]+?)\|\|/.exec(source);
		if (!match) return null;
		return { capture: match[0], data: match[1] };
	},
	element: (data, parse, state) => {
		const [open, setOpen] = createSignal(false);
		state.inSpoiler = true;
		return (
			<span
				classList={{
					"md-spoiler": true,
					open: open(),
				}}
				onClick={() => setOpen(true)}
			>
				<span>{parse(data)}</span>
			</span>
		);
	},
	order: 25,
	requiredFirstCharacters: "||",
});
