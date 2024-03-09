import { array, boolean, number, object, optional, string } from "valibot";

import { equalArray } from "../common";

export const footer = object({
	icon_url: optional(string()),
	proxy_icon_url: optional(string()),
	text: string(),
});

export const image = object({
	height: optional(number()),
	proxy_url: optional(string()),
	url: string(),
	width: optional(number()),
});

export const thumbnail = image;

export const video = image;

export const provider = object({
	name: optional(string()),
	url: optional(string()),
});

export const author = object({
	icon_url: optional(string()),
	name: string(),
	proxy_icon_url: optional(string()),
	url: optional(string()),
});

export const field = object({
	inline: optional(boolean()),
	name: string(),
	value: string(),
});

export default object({
	author: optional(author),
	color: optional(number()),
	description: optional(string()),
	fields: optional(array(field)),
	footer: optional(footer),
	image: optional(image),
	provider: optional(provider),
	thumbnail: optional(thumbnail),
	timestamp: optional(string()),
	title: optional(string()),
	type: optional(equalArray(["rich", "image", "video", "gifv", "article", "link"] as const)),
	url: optional(string()),
	video: optional(video),
});
