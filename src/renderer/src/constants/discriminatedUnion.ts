// polyfill until new package publish
// https://github.com/fabian-hiller/valibot/blob/main/library/src/schemas/discriminatedUnion/discriminatedUnion.ts

import type { BaseSchema, ErrorMessage, Input, Issues, Output } from "valibot";
import type { ObjectSchema } from "valibot";

import { getIssues, getOutput, getSchemaIssues } from "valibot";

/**
 * Discriminated union option type.
 */
export type DiscriminatedUnionOption<TKey extends string> =
	| ObjectSchema<Record<TKey, BaseSchema>, any>
	| (BaseSchema & {
			discriminatedUnion: DiscriminatedUnionOptions<TKey>;
			schema: "discriminated_union";
	  });

/**
 * Discriminated union options type.
 */
export type DiscriminatedUnionOptions<TKey extends string> = [
	DiscriminatedUnionOption<TKey>,
	DiscriminatedUnionOption<TKey>,
	...DiscriminatedUnionOption<TKey>[],
];

/**
 * Discriminated union schema type.
 */
export type DiscriminatedUnionSchema<
	TKey extends string,
	TOptions extends DiscriminatedUnionOptions<TKey>,
	TOutput = Output<TOptions[number]>,
> = BaseSchema<Input<TOptions[number]>, TOutput> & {
	discriminatedUnion: TOptions;
	schema: "discriminated_union";
};

/**
 * Creates a discriminated union schema.
 *
 * @param key The discriminator key.
 * @param options The union options.
 * @param error The error message.
 *
 * @returns A discriminated union schema.
 */
export function discriminatedUnion<TKey extends string, TOptions extends DiscriminatedUnionOptions<TKey>>(
	key: TKey,
	options: TOptions,
	error?: ErrorMessage,
): DiscriminatedUnionSchema<TKey, TOptions> {
	return {
		/**
		 * Parses unknown input based on its schema.
		 *
		 * @param input The input to be parsed.
		 * @param info The parse info.
		 *
		 * @returns The parsed output.
		 */
		// eslint-disable-next-line
		_parse(input, info) {
			// Check type of input
			if (!input || typeof input !== "object" || !(key in input)) {
				return getSchemaIssues(info, "type", "discriminated_union", error || "Invalid type", input);
			}

			// Create issues and output
			let issues: Issues | undefined;
			let output: [Record<string, any>] | undefined;

			// Create function to parse options recursively
			// eslint-disable-next-line
			const parseOptions = (options: DiscriminatedUnionOptions<TKey>) => {
				for (const schema of options) {
					// If it is an object schema, parse discriminator key
					if (schema.schema === "object") {
						const result = schema.object[key]._parse((input as Record<TKey, unknown>)[key], info);

						// If right union option was found, parse it
						if (!result.issues) {
							const result = schema._parse(input, info);

							// If there are issues, capture them
							if (result.issues) {
								issues = result.issues;

								// Otherwise, set output
							} else {
								// Note: Output is nested in array, so that also a falsy value
								// further down can be recognized as valid value
								output = [result.output];
							}

							// Break loop to end execution
							break;
						}

						// Otherwise, if it is a discriminated union parse its options
						// recursively
					} else if (schema.schema === "discriminated_union") {
						parseOptions(schema.discriminatedUnion);

						// If union option was found, break loop to end execution
						if (issues || output) {
							break;
						}
					}
				}
			};

			// Parse options recursively
			parseOptions(options);

			// Return output or issues
			return output
				? getOutput(output[0])
				: issues
				? getIssues(issues)
				: getSchemaIssues(info, "type", "discriminated_union", error || "Invalid type", input);
		},

		/**
		 * Whether it's async.
		 */
		async: false,

		/**
		 * The discriminated union schema.
		 */
		discriminatedUnion: options,

		/**
		 * The schema type.
		 */
		schema: "discriminated_union",
	};
}
