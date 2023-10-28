import { boolean, nullable, number, object, optional, string } from "valibot";

export default object({
	content_type: optional(string()),
	description: optional(string()),
	duration_secs: optional(number()),
	ephemeral: optional(boolean()),
	filename: string(),
	flags: optional(number()),
	height: optional(nullable(number())),
	id: string(),
	placeholder: optional(string()),
	placeholder_version: optional(number()),
	proxy_url: string(),
	size: number(),
	url: string(),
	waveform: optional(string()),
	width: optional(nullable(number())),
});
