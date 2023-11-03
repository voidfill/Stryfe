import { boolean, nullable, number, object, optional, string } from "valibot";

export default object({
	color: number(),
	flags: number(),
	hoist: boolean(),
	icon: nullable(string()),
	id: string(),
	managed: boolean(),
	mentionable: boolean(),
	name: string(),
	permissions: string(),
	position: number(),
	tags: object({
		bot_id: optional(string()),
	}),
	unicode_emoji: nullable(string()),
});
