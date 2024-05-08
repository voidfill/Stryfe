/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Dynamic } from "solid-js/web";

import attachmentlink from "./attachmentlink";
import blockquote from "./blockquote";
import { channelmention, channelormessage } from "./channelormessage";
import { codeblock, inlinecode } from "./code";
import customemoji from "./customemoji";
import { Parser, Rule, ruleTypeGuard as r } from "./lib";
import { othermention, usermention } from "./mention";
import rolemention from "./rolemention";
import spoiler from "./spoiler";
import timestamp from "./timestamp";
import url from "./url";

import "./style.scss";

const rules: Record<string, Rule<any>> = {
	attachmentlink,
	blockquote,
	br: r({
		doesMatch: (source) => {
			const match = /^ {2,}\n/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: null,
			};
		},
		element: () => <br />,
		order: 24,
	}),
	channelmention,
	channelormessage,
	codeblock,
	customemoji,
	em: r({
		doesMatch: (source) => {
			const match =
				// eslint-disable-next-line no-useless-escape
				/^\b_((?:_[_(]|\\[\s\S]|(?<!_)\B_\B|[^\\_])+?)_(?![(])\b|^\*(?=\S)((?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s\*\\]|\*\*)|[^\s\*\\])+?)\*(?!\*)/.exec(
					source,
				);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[2] || match[1],
				quality: match[0].length,
			};
		},
		element: (data, parse) => <em>{parse(data)}</em>,
		hasQuality: true,
		order: 21,
		requiredFirstCharacters: "*",
	}),
	escape: r({
		doesMatch: (source) => {
			const match = /^\\([^0-9A-Za-z\s])/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[0][1],
			};
		},
		element: (data) => <span>{data}</span>,
		order: 12,
		requiredFirstCharacters: "\\",
	}),
	heading: r({
		doesMatch: (source, state) => {
			if (!state.allowHeading) return null;
			const match = /^ *(#{1,3})(?:\s+)((?![#]+)[^\n]+?)#*\s*(?:\n|$)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: { content: match[2], level: match[1].length },
			};
		},
		element: (data, parse, state) => {
			state.allowHeading = false;
			const content = parse(data.content);
			return <Dynamic component={`h${data.level}`}>{content}</Dynamic>;
		},
		order: 0,
		requiredFirstCharacters: "#",
	}),
	inlinecode,
	looseEm: r({
		doesMatch: (source) => {
			// eslint-disable-next-line no-useless-escape
			const match = /^\*(?=\S)((?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s\*\\]|\*\*)|[^\s\*\\])+?) {1,2}\*(?!\*)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[1],
				quality: match[0].length + 0.2,
			};
		},
		element: (data, parse) => <em>{parse(data)}</em>,
		hasQuality: true,
		order: 21,
		requiredFirstCharacters: "*",
	}),
	newline: r({
		doesMatch: (source, state) => {
			if (state.inline) return null;
			const match = /^(?:\n *)*\n/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: null,
			};
		},
		element: () => <span>{"\n"}</span>,
		order: 10,
		requiredFirstCharacters: "\n",
	}),
	othermention,
	paragraph: r({
		doesMatch: (source, state) => {
			if (state.inline) return null;
			const match = /^((?:[^\n]|\n(?! *\n))+)(?:\n *)+\n/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[1],
			};
		},
		element: (data, parse) => <p>{parse(data)}</p>,
		order: 11,
	}),
	rolemention,
	s: r({
		doesMatch: (source) => {
			const match = /^~~([\s\S]+?)~~(?!_)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[1],
			};
		},
		element: (data, parse) => <s>{parse(data)}</s>,
		order: 21,
		requiredFirstCharacters: "~~",
	}),
	spoiler,
	strong: r({
		doesMatch: (source) => {
			const match = /^\*\*((?:\\[\s\S]|[^\\])+?)\*\*(?!\*)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[1],
				quality: match[0].length + 0.1,
			};
		},
		element: (data, parse) => <strong>{parse(data)}</strong>,
		hasQuality: true,
		order: 21,
		requiredFirstCharacters: "**",
	}),
	text: r({
		doesMatch: (source) => {
			const match = /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff]|\n\n| {2,}\n|\w+:\S|[0-9]+\.|$)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[0],
			};
		},
		element: (data) => <span>{data}</span>,
		order: Infinity,
	}),
	timestamp,
	u: r({
		doesMatch: (source) => {
			const match = /^__((?:\\[\s\S]|[^\\])+?)__(?!_)/.exec(source);
			if (!match) return null;
			return {
				capture: match[0],
				data: match[1],
				quality: match[0].length,
			};
		},
		element: (data, parse) => <u>{parse(data)}</u>,
		order: 21,
		requiredFirstCharacters: "__",
	}),
	url,
	usermention,
};

export const parse = Parser(Object.values(rules));
