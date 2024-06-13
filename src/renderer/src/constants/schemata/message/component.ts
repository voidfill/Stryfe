import { array, boolean, literal, number, object, optional, picklist, string, variant } from "valibot";

export const button = object({
	custom_id: optional(string()), // either url or custom_id must be present. sadly there is no good way to do this with valibot
	disabled: optional(boolean()),
	emoji: optional(
		object({
			animated: optional(boolean()),
			id: optional(string()),
			name: optional(string()),
		}),
	),
	labeL: optional(string()),
	style: picklist([1, 2, 3, 4, 5] as const),
	type: literal(2),
	url: optional(string()),
});

export const textInput = object({
	custom_id: string(),
	label: string(),
	max_length: optional(number()),
	min_length: optional(number()),
	placeholder: optional(string()),
	required: optional(boolean()),
	style: picklist([1, 2] as const),
	type: literal(4),
	value: optional(string()),
});

export const stringSelect = object({
	custom_id: string(),
	disabled: optional(boolean()),
	max_values: optional(number()),
	min_values: optional(number()),
	options: array(
		object({
			default: optional(boolean()),
			description: optional(string()),
			emoji: optional(
				object({
					animated: optional(boolean()),
					id: optional(string()),
					name: optional(string()),
				}),
			),
			label: string(),
			value: string(),
		}),
	),
	placeholder: optional(string()),
	type: literal(3),
});

// TODO: Figure out automatically populated values, default values

export const userSelect = object({
	custom_id: string(),
	disabled: optional(boolean()),
	max_values: optional(number()),
	min_values: optional(number()),
	placeholder: optional(string()),
	type: literal(5),
});

export const roleSelect = object({
	custom_id: string(),
	disabled: optional(boolean()),
	max_values: optional(number()),
	min_values: optional(number()),
	placeholder: optional(string()),
	type: literal(6),
});

export const mentionableSelect = object({
	custom_id: string(),
	disabled: optional(boolean()),
	max_values: optional(number()),
	min_values: optional(number()),
	placeholder: optional(string()),
	type: literal(7),
});

export const channelSelect = object({
	channel_types: optional(array(number())),
	custom_id: string(),
	disabled: optional(boolean()),
	max_values: optional(number()),
	min_values: optional(number()),
	placeholder: optional(string()),
	type: literal(8),
});

export const actionRow = object({
	components: array(variant("type", [button, stringSelect, textInput, userSelect, roleSelect, mentionableSelect, channelSelect])),
	type: literal(1),
});

export default variant("type", [actionRow, button, stringSelect, textInput, userSelect, roleSelect, mentionableSelect, channelSelect]);
