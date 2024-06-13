import { boolean, nullable, number, object, optional, string } from "valibot";

import { user } from "./common";

export const relationship = object({
	id: string(),
	nickname: nullable(string()),
	since: optional(string()),
	type: number(),
	user_id: string(),
});

export const RELATIONSHIP_ADD = object({
	id: string(),
	nickname: nullable(string()),
	should_notify: boolean(),
	since: optional(string()),
	type: number(),
	user: user,
});

export const RELATIONSHIP_REMOVE = relationship;
