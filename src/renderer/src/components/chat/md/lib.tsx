// this file is mostly just a more basic, cut down and adapted for solidjs version of simple-markdown
// https://github.com/Khan/perseus/tree/main/packages/simple-markdown

import { JSX } from "solid-js/jsx-runtime";

type state = {
	[key: string]: any;
	readonly outputData: {
		[key: string]: any;
	};
	readonly prevCapture?: string;
};

export type Rule<T> = {
	doesMatch: (source: string, state: state) => { capture: string; data: T; quality?: number } | null;
	element: (data: T, parse: (source: string, state?: state) => JSX.Element, state: state) => JSX.Element;
	hasQuality?: boolean;
	order: number;
	requiredFirstCharacters?: string;
};

export function ruleTypeGuard<T>(rule: Rule<T>): Rule<T> {
	return rule;
}

export function Parser(rules: Rule<any>[]): (
	source: string,
	state?: state,
) => {
	element: JSX.Element;
	outputData: { [key: string]: any };
} {
	rules = rules.sort((a, b) => {
		if (a.order === b.order) return a.hasQuality ? -1 : 1;
		return a.order - b.order;
	});

	function parse(source: string, state: state): JSX.Element {
		const output: JSX.Element = [];
		let prevCapture: string | undefined = undefined;

		while (source.length) {
			let selectedRule: Rule<any> | undefined,
				selectedMatch: ReturnType<Rule<any>["doesMatch"]> | null = null,
				currentOrder: number | null = null,
				currentQuality = -Infinity;

			for (const rule of rules) {
				if (currentOrder && rule.order > currentOrder) continue;
				if (rule.requiredFirstCharacters && !source.startsWith(rule.requiredFirstCharacters)) continue;
				const match = rule.doesMatch(source, { ...state, prevCapture });
				if (match) {
					currentOrder ??= rule.order;
					const quality = match.quality ?? 0;
					if (quality > currentQuality) {
						selectedRule = rule;
						selectedMatch = match;
						currentQuality = quality;
					}
				}
			}

			if (!selectedRule || !selectedMatch) throw new Error(`No rule matched: ${source}`);
			prevCapture = selectedMatch.capture;
			const newState = { ...state };
			output.push(selectedRule.element(selectedMatch.data, (source: string, state: state = newState) => parse(source, state), newState));
			source = source.slice(selectedMatch.capture.length);
		}

		return output;
	}

	return (source: string, startState: state = { outputData: {} }) => ({
		element: <span class="markdown-root">{parse(source, startState)}</span>,
		outputData: startState.outputData,
	});
}
