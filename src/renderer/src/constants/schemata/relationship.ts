import { user } from "./common";

import { boolean, nullable, number, object, optional, string } from "valibot";

export const relationship = object({
	id: string(),
	nickname: nullable(string()),
	since: optional(string()),
	type: number(),
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
