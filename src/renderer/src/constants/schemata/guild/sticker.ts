import { boolean, nullable, number, object, string, unknown } from "valibot";

export default object({
	asset: unknown(),
	available: boolean(),
	description: nullable(string()),
	format_type: number(),
	guild_id: string(),
	id: string(),
	name: string(),
	tags: string(),
	type: number(),
});
