import { array, boolean, nullable, number, object, optional, picklist, string, union, unknown } from "valibot";

import { ActivityTypes } from "../user";
import { status, user } from "./common";

export const client_status = object({
	desktop: optional(status),
	mobile: optional(status),
	web: optional(status),
});

export const activity_type = picklist([
	ActivityTypes.PLAYING,
	ActivityTypes.STREAMING,
	ActivityTypes.LISTENING,
	ActivityTypes.WATCHING,
	ActivityTypes.CUSTOM,
	ActivityTypes.COMPETING,
	ActivityTypes.HANG_STATUS,
]);
export const activity = object({
	application_id: optional(union([string(), number()])),
	assets: optional(
		object({
			large_image: optional(string()),
			large_text: optional(string()),
			small_image: optional(string()),
			small_text: optional(string()),
		}),
	),
	buttons: optional(
		union([
			array(
				object({
					label: string(),
					url: string(),
				}),
			),
			array(string()),
		]),
	),
	created_at: string(),
	details: optional(string()),
	emoji: optional(
		nullable(
			object({
				animated: optional(boolean()),
				id: optional(string()),
				name: string(),
			}),
		),
	),
	flags: optional(number()),
	id: string(),
	instance: optional(boolean()),
	name: string(),
	party: optional(
		object({
			id: optional(string()),
			size: optional(unknown()),
		}),
	),
	secrets: optional(
		object({
			join: optional(string()),
			match: optional(string()),
			spectate: optional(string()),
		}),
	),
	session_id: optional(string()),
	state: optional(nullable(string())),
	sync_id: optional(string()),
	timestamps: optional(
		object({
			end: optional(string()),
			start: optional(union([number(), string()])),
		}),
	),
	type: activity_type,
	url: unknown(),
});

export const PRESENCE_UPDATE = object({
	activities: nullable(array(activity)),
	broadcast: nullable(unknown()),
	client_status: client_status,
	guild_id: optional(string()),
	status: status,
	user: union([
		user,
		object({
			id: string(),
		}),
	]),
});
