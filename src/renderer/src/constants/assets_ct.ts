import { readdirSync } from "fs";
import { CompileTimeFunctionResult } from "vite-plugin-compile-time";

export default async (): Promise<CompileTimeFunctionResult> => {
	return {
		data: {
			avatars: readdirSync("src/renderer/public/avatars"),
			groupIcons: readdirSync("src/renderer/public/groupicons"),
		} as const,
	};
};
