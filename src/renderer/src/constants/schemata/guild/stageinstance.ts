import { boolean, nullable, number, object, string } from "valibot";

export const STAGE_INSTANCE_CREATE = object({
	channel_id: string(),
	discoverable_disabled: boolean(),
	guild_id: string(),
	guild_scheduled_event_id: nullable(string()),
	id: string(),
	invite_code: nullable(string()),
	privacy_level: number(),
	topic: string(),
});

export const STAGE_INSTANCE_DELETE = STAGE_INSTANCE_CREATE;
