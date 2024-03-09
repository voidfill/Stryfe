module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:solid/typescript",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:prettier/recommended",
	],
	overrides: [
		{
			files: ["*.js"],
			rules: {
				"@typescript-eslint/explicit-function-return-type": "off",
			},
		},
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint", "solid", "sort-keys-plus", "typescript-sort-keys", "simple-import-sort"],
	root: true,
	rules: {
		"@typescript-eslint/ban-ts-comment": ["error", { minimumDescriptionLength: 1, "ts-expect-error": "allow-with-description" }],
		"@typescript-eslint/ban-types": [
			"error",
			{
				extendDefaults: true,
				types: {
					Omit: {
						fixWith: "DistributiveOmit",
						message: "Use DistributiveOmit instead, Omit doesnt distribute over unions.",
					},
				},
			},
		],
		"@typescript-eslint/explicit-function-return-type": "error",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-empty-function": ["error", { allow: ["arrowFunctions"] }],
		"@typescript-eslint/no-explicit-any": "off", // i cant do this without any.
		"@typescript-eslint/no-namespace": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-var-requires": "off",
		"no-fallthrough": ["error", { commentPattern: "@fallthrough" }], // no autofixer sadly.
		"prettier/prettier": [
			"error",
			{
				endOfLine: "auto",
			},
		],

		"simple-import-sort/imports": [
			"error",
			{
				groups: [
					["^\\u0000"],
					["^node:", "electron", "^path$", "^os$"],
					["^@solidjs", "^solid-js", "^@solid-primitives", "^valibot"],
					["^@constants"],
					["^@modules"],
					["^@stores"],
					["^@components", "solid-icons"],
					["^\\."],
					["^node:.*\\u0000$", "^@?\\w.*\\u0000$", "^[^.].*\\u0000$", "^\\..*\\u0000$"],
					["^.+\\.s?css$"],
					["^@resources"],
				],
			},
		],
		"sort-keys-plus/sort-keys": ["warn", "asc", { caseSensitive: true, natural: true }], // if you rely on object key order, youre doing it wrong.
		"typescript-sort-keys/interface": ["warn", "asc", { caseSensitive: true, natural: true }],
	},
};
