import { array, boolean, nullable, number, object, optional, string } from "valibot";

import { status } from "../common";
import { activity } from "../presence";

export const session = object({
	active: optional(boolean()),
	activities: nullable(array(activity)),
	client_info: object({
		client: string(),
		os: string(),
		version: number(),
	}),
	session_id: string(),
	status: status,
});

export const SESSIONS_REPLACE = array(session);
