import { genericMessage } from "@constants/schemata/message";

import Dispatcher from "@modules/dispatcher";
import { Logger } from "@modules/logger";

import { array, merge, object, optional, Output, parse } from "valibot";

const logger = new Logger("API", "red");
const API_VERSION = 9;
const basePath = `https://discord.com/api/v${API_VERSION}`;

type RequestOptions = {
	auth: boolean;
	form?: any;
	headers?: Record<string, string>;
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	searchParams?: Record<string, string | undefined>;
};

const messageArraySchema = array(
	merge([
		genericMessage,
		object({
			referenced_message: optional(genericMessage),
		}),
	]),
);

class API {
	#initialized = false;
	#captchaHandler: any;
	#token: string | undefined;
	#b64info: string | undefined;

	init(token: string, captchaHandler: any, b64info: string): void {
		this.#captchaHandler = captchaHandler;
		this.#b64info = b64info;
		this.#token = token;

		this.#initialized = true;
	}

	async request(options: RequestOptions): Promise<any> {
		logger.info("Request", options);

		if (!this.#initialized) throw new Error("API not initialized");
		// TODO: rate limiting

		const url = new URL(`${basePath}${options.path}`);
		if (options.searchParams) {
			for (const kv of Object.entries(options.searchParams).filter((e) => e[1] !== undefined)) {
				url.searchParams.append(kv[0], kv[1] as string);
			}
		}

		return fetch(url, {
			...(options.form && { body: JSON.stringify(options.form) }),
			headers: {
				...(options.headers ?? {}),
				...(options.auth && {
					Authorization: this.#token,
					"x-debug-options": "bugReporterEnabled",
					"x-discord-locale": "en-US",
					"x-super-properties": this.#b64info,
				}),
				"Content-Type": "application/json",
			},
			method: options.method,
			...(options.auth && { credentials: "include" }),
		}).then((res) => {
			// TODO: error handling, captcha handling
			return res.json();
		});
	}

	async get(options: DistributiveOmit<RequestOptions, "method">): Promise<any> {
		return this.request({ ...options, method: "GET" });
	}

	async post(options: DistributiveOmit<RequestOptions, "method">): Promise<any> {
		return this.request({ ...options, method: "POST" });
	}

	async put(options: DistributiveOmit<RequestOptions, "method">): Promise<any> {
		return this.request({ ...options, method: "PUT" });
	}

	async patch(options: DistributiveOmit<RequestOptions, "method">): Promise<any> {
		return this.request({ ...options, method: "PATCH" });
	}

	async delete(options: DistributiveOmit<RequestOptions, "method">): Promise<any> {
		return this.request({ ...options, method: "DELETE" });
	}

	async acceptInvite(
		code: string,
		context: {
			location: string;
			location_channel_id: string;
			location_channel_type: number;
			location_guild_id: string;
			location_message_id: string;
		},
	): ReturnType<typeof API.prototype.post> {
		const sessionId = window.gateway?.sessionId;
		if (!sessionId) throw new Error("No session ID");

		return this.post({
			auth: true,
			form: {
				session_id: sessionId,
			},
			headers: {
				"x-context-properties": btoa(JSON.stringify(context)),
			},
			path: `/invites/${code}`,
		});
	}

	async getMessages(options: {
		after?: string;
		around?: string;
		before?: string;
		channelId: string;
		limit?: number;
	}): Promise<Output<typeof messageArraySchema>> {
		options.limit ??= 50;
		if (options.limit < 1 || options.limit > 50) throw new Error("Limit must be between 1 and 50");

		let res = await this.get({
			auth: true,
			path: `/channels/${options.channelId}/messages`,
			searchParams: {
				after: options.after,
				around: options.around,
				before: options.before,
				limit: options.limit.toString(),
			},
		});

		if (window.isDev) res = parse(messageArraySchema, res);

		Dispatcher.emit("MESSAGES_FETCH_SUCCESS", {
			messages: res,
			...options,
		});

		return res;
	}
}

declare global {
	interface Window {
		API: API;
	}

	interface customDispatches {
		MESSAGES_FETCH_SUCCESS: Parameters<API["getMessages"]>[0] & { messages: Output<typeof messageArraySchema> };
	}
}

export default window.API = new API();
