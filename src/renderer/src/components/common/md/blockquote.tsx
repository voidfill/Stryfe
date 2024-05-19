import { ruleTypeGuard } from "./lib";

export default ruleTypeGuard({
	doesMatch: (source, state) => {
		if (state.inQuote || state.formatInline) return null;
		if (state.prevCapture && !/^$|\n *$/.exec(state.prevCapture)) return null;
		const match = /^( *>>> +([\s\S]*))|^( *>(?!>>) +[^\n]*(\n *>(?!>>) +[^\n]*)*\n?)/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: match[0],
		};
	},
	element: (data, parse, state) => {
		state.inQuote = true;
		state.allowHeading = false;

		const tripleR = /^ *>>> ?/;
		const isTripleR = tripleR.test(data);
		data = data.replace(isTripleR ? tripleR : /^ *> ?/gm, "");
		if (!isTripleR) state.inline = true;

		return (
			<div class="md-blockquote">
				<div />
				<blockquote>{parse(data)}</blockquote>
			</div>
		);
	},
	order: 6,
	requiredFirstCharacters: ">",
});
