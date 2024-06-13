import { literal, nullable, object, picklist, string } from "valibot";

export const enum JoinRequestStatus {
	APPROVED = "APPROVED",
	STARTED = "STARTED",
}

const request = object({
	application_status: picklist([JoinRequestStatus.APPROVED, JoinRequestStatus.STARTED]), // TOOD: add whatever other state there is, denied?
	created_at: string(),
	guild_id: string(),
	id: string(),
	interview_channel_id: nullable(string()),
	last_seen: nullable(string()),
	rejection_reason: nullable(string()),
	user_id: string(),
});

export const GUILD_JOIN_REQUEST_CREATE = object({
	guild_id: string(),
	request,
	status: literal(JoinRequestStatus.STARTED),
});

export const GUILD_JOIN_REQUEST_UPDATE = object({
	guild_id: string(),
	request,
	status: picklist([JoinRequestStatus.APPROVED]), // TODO: add denied
});

export const GUILD_JOIN_REQUEST_DELETE = object({
	guild_id: string(),
	id: string(),
	user_id: string(),
});
