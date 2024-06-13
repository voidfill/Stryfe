import { boolean, nullable, number, object, picklist, string, unknown } from "valibot";

export const enum StickerFormatType {
	PNG = 1,
	APNG = 2,
	LOTTIE = 3,
	GIF = 4,
}

export default object({
	asset: unknown(),
	available: boolean(),
	description: nullable(string()),
	format_type: picklist([StickerFormatType.PNG, StickerFormatType.APNG, StickerFormatType.LOTTIE, StickerFormatType.GIF]),
	guild_id: string(),
	id: string(),
	name: string(),
	tags: string(),
	type: number(),
});
