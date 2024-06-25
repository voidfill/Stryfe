import { object, string, unknown } from "valibot";

export const CONVERSATION_SUMMARY_UPDATE = object({
	channel_id: string(),
	guild_id: string(),
	summaries: unknown(),
});
