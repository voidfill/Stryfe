import { safeParse } from "valibot";

import { GatewayPayload, OPCodes, recoverableCloseCodes, SocketGatewayCloseCodes } from "@constants/gateway";
import { dispatches as __allDispatches } from "@constants/schemata";

import { clientProperties } from "./discordversion";
import Dispatcher from "./dispatcher";
import { Logger } from "./logger";
import packworker from "./packworker?worker&inline";
import { clearToken } from "./token";
import unpackworker from "./unpackworker?worker&inline";

declare global {
	interface customDispatches {
		GATEWAY_CONNECT: undefined;
		GATEWAY_DISCONNECT: undefined;
		GATEWAY_GIVE_UP: undefined;
	}
}

const logger = new Logger("WebSocket", "blue");

const upw = new unpackworker();
const pw = new packworker();
upw.onmessage = pw.onmessage = (): void => {};
upw.onerror = (error: ErrorEvent): void => {
	error.preventDefault();
	logger.error("Unpack worker error:", error);
};
pw.onerror = (error: ErrorEvent): void => {
	error.preventDefault();
	logger.error("Pack worker error:", error);
};

const enum ConnectionState {
	Disconnected,
	Connecting,
	Connected,
	Resuming,
}

const HELLO_TIMEOUT = 20_000,
	HEARTBEAT_MAX_RESUME_THRESHOLD = 60 * 3 * 1000,
	MAX_RETRIES = 20,
	capabilities = 16381,
	guildSubscriptionUpdateMaxSize = 15360;

type guildSubscription = {
	activities: boolean;
	channels?: Record<string, [number, number][]>;
	threads: boolean;
	typing: boolean;
};

export default class GatewaySocket {
	#gatewayURL = "wss://gateway.discord.gg";
	#gatewayVersion: number;
	#token: string;
	#clientProperties: clientProperties;

	#state: ConnectionState = ConnectionState.Disconnected;
	#socket: WebSocket | null = null;

	#attempts = 0;
	#seq = 0;
	#sessionId: string | null = null;
	#helloTimeout: NodeJS.Timeout | undefined = undefined;
	#heart: {
		ack: boolean;
		beat: NodeJS.Timeout | undefined;
		interval: number | null;
		lastAck: number | null;
	} = {
		ack: false,
		beat: undefined,
		interval: null,
		lastAck: null,
	};
	#resumable = false;

	#trace: string[] = [];

	#guildSubscriptions: Record<string, guildSubscription> = {};

	getGuildSubscription(id: string): guildSubscription | undefined {
		return this.#guildSubscriptions[id];
	}

	get sessionId(): string | null {
		return this.#sessionId;
	}

	get trace(): string[] {
		return this.#trace;
	}

	get canResume(): boolean {
		return !!this.#sessionId && this.#resumable && this.#seq > 0 && Date.now() - (this.#heart.lastAck ?? 0) < HEARTBEAT_MAX_RESUME_THRESHOLD;
	}

	constructor(token: string, clientProperties: clientProperties, gatewayVersion = 9) {
		this.#token = token;
		this.#clientProperties = clientProperties;
		this.#gatewayVersion = gatewayVersion;

		upw.onmessage = ({ data }): void => void this.#onData(data);
		pw.onmessage = ({ data }): void => void this.#__send(data);
		this.#createSocket();
	}

	#closeWithoutEmit(code?: number, reason?: string): void {
		if (!this.#socket) return;
		this.#socket.onclose = null;
		this.#socket.onmessage = null;
		this.#socket.onerror = null;
		this.#socket.onopen = null;
		this.#socket.close(code ?? 1000, reason);
	}

	#createSocket(): void {
		if (this.#state === ConnectionState.Connected || this.#state === ConnectionState.Connecting) return;
		this.#state = ConnectionState.Connecting;
		this.#attempts++;
		upw.postMessage("reset");

		this.#helloTimeout = setTimeout(() => {
			this.#socket?.close(SocketGatewayCloseCodes.UNKNOWN_ERROR, "Hello timeout");
		}, HELLO_TIMEOUT);
		this.#closeWithoutEmit();
		this.#socket = new WebSocket(`${this.#gatewayURL}/?v=${this.#gatewayVersion}&compress=zlib-stream&encoding=etf`);
		this.#socket.binaryType = "arraybuffer";

		this.#socket.onmessage = ({ data }): void => upw.postMessage(data, [data]);
		this.#socket.onopen = (): void => this.#onOpen();
		this.#socket.onclose = (event): void => this.handleClose(event);
		this.#socket.onerror = (event): void => this.#handleError(event);
	}

	#onOpen(): void {
		if (this.#state === ConnectionState.Resuming) return;
		this.canResume ? this.#resume() : this.#identify();
	}

	handleClose({ wasClean = false, code, reason }: { code: number; reason?: string; wasClean: boolean }): void {
		this.#state = ConnectionState.Disconnected;
		this.#stopHeartbeat();
		Dispatcher.emit("GATEWAY_DISCONNECT");
		logger.log("Disconnected from gateway:", wasClean, code, reason);

		if (code === SocketGatewayCloseCodes.AUTHENTICATION_FAILED) return clearToken();
		if (!(recoverableCloseCodes[code as SocketGatewayCloseCodes] ?? true)) throw new Error(`Gateway closed with unrecoverable code: ${code}`);

		this.#resumable = true;
		if (code === SocketGatewayCloseCodes.INVALID_SEQUENCE) this.#seq = 0;

		if (this.#attempts >= MAX_RETRIES) {
			logger.warn("Max retries reached, not reconnecting");
			return Dispatcher.emit("GATEWAY_GIVE_UP");
		}
		setTimeout(() => this.#createSocket(), 1000 * this.#attempts);
	}

	#handleError(error: Event): void {
		logger.error("Socket error:", error);
		this.#socket?.close(SocketGatewayCloseCodes.UNKNOWN_ERROR, "Socket error");
	}

	#resume(): void {
		logger.info("Attempting to resume session");
		this.#state = ConnectionState.Resuming;
		this.#resumable = false;

		this.#send(OPCodes.RESUME, {
			seq: this.#seq,
			session_id: this.#sessionId,
			token: this.#token,
		});
	}

	#identify(): void {
		this.#seq = 0;
		this.#sessionId = null;
		this.#state = ConnectionState.Connecting;

		this.#send(OPCodes.IDENTIFY, {
			capabilities: capabilities,
			client_state: {
				api_code_version: undefined,
				guild_versions: {},
				highest_last_message_id: undefined,
				initial_guild_id: undefined,
				private_channels_version: undefined,
				read_state_version: undefined,
				user_guild_settings_version: undefined,
				user_settings_version: undefined,
			},
			compress: false,
			presence: {
				activities: [],
				afk: false,
				broadcast: undefined,
				since: 0,
				status: "unknown",
			},
			properties: this.#clientProperties,
			token: this.#token,
		});
	}

	#onData(data: GatewayPayload): void {
		switch (data.op) {
			case OPCodes.DISPATCH:
				this.#seq = data.s;
				if (window.isDev) {
					if (data.t in __allDispatches) {
						const res = safeParse(__allDispatches[data.t], data.d);
						if (!res.success) {
							logger.error("Failed to typecheck Dispatch:", data.t, res.issues, data.d);
							throw "Failed to typecheck Dispatch";
						}
						data.d = res.output;
					} else {
						logger.warn("Dispatch unaccounted for:", data.t, data.d);
					}
				}

				switch (data.t) {
					case "READY":
						this.#sessionId = data.d.session_id;
						this.#gatewayURL = data.d.resume_gateway_url;
						this.#trace = data.d._trace;
						break;
					case "READY_SUPPLEMENTAL":
						this.#attempts = 0;
						this.#state = ConnectionState.Connected;
						Dispatcher.emit("GATEWAY_CONNECT");
						break;
					case "RESUMED":
						this.#attempts = 0;
						this.#state = ConnectionState.Connected;
						this.#helloTimeout &&= clearTimeout(this.#helloTimeout) as undefined;
						this.#trace = data.d._trace;
						Dispatcher.emit("GATEWAY_CONNECT");
				}

				Dispatcher.emit(data.t, data.d);
				break;

			case OPCodes.HEARTBEAT_ACK:
				this.#heart.ack = true;
				this.#heart.lastAck = Date.now();
				break;

			case OPCodes.HELLO:
				this.#helloTimeout &&= clearTimeout(this.#helloTimeout) as undefined;
				this.#startHeartbeat(data.d.heartbeat_interval);
				this.#trace = data.d._trace;
				break;

			case OPCodes.RECONNECT:
				data.d = true;
			// @fallthrough
			case OPCodes.INVALID_SESSION:
				if (data.d) {
					this.#resumable = true;
				}
				this.#createSocket();
				break;

			default:
				logger.warn("Unhandled opcode:", data.op, data);
		}
	}

	#startHeartbeat(interval: number): void {
		this.#stopHeartbeat();
		Object.assign(this.#heart, {
			ack: true,
			beat: setInterval(() => {
				if (!this.#heart.ack) return void this.#socket?.close(SocketGatewayCloseCodes.UNKNOWN_ERROR, "Heartbeat timeout");
				this.#send(OPCodes.HEARTBEAT, this.#seq);
			}, interval),
			interval,
			lastAck: Date.now(),
		});
	}

	#stopHeartbeat(): void {
		this.#heart.beat &&= clearInterval(this.#heart.beat) as undefined;
	}

	#send(opcode: OPCodes, data: any): void {
		if (this.#socket?.readyState !== WebSocket.OPEN) return logger.warn("Attempted to send message while socket is not open");
		if (this.#state !== ConnectionState.Connected && this.#state !== ConnectionState.Connecting && this.#state !== ConnectionState.Resuming)
			return logger.warn("Attempted to send message while not connected");
		logger.info("Trying to send message:", opcode, data);
		pw.postMessage({ d: data, op: opcode });
	}

	#__send(data: Uint8Array): void {
		try {
			this.#socket?.send(data);
		} catch (error) {
			logger.error("Failed to send message:", error);
		}
	}

	requestMembers(options: { guild_id: string; limit: number; nonce?: string; presences?: boolean; query?: string; user_ids?: string[] }): void {
		this.#send(OPCodes.REQUEST_GUILD_MEMBERS, options);
	}

	// TODO: dispatch update on reconnect / resume whatever.
	// or maybe nuke and reestablish? good chance to clean up unused subscriptions.
	#scheduledGuildSubUpdates: Record<string, Partial<guildSubscription>> = {};
	#scheduledGuildSubUpdateTimeout: NodeJS.Timeout | undefined = undefined;
	updateGuildSubscription(guildId: string, value: Partial<guildSubscription>): void {
		this.#guildSubscriptions[guildId] = value = Object.assign(
			this.#guildSubscriptions[guildId] ?? { activities: false, threads: false, typing: false },
			value,
		);

		this.#scheduledGuildSubUpdates[guildId] = Object.assign(this.#scheduledGuildSubUpdates[guildId] ?? {}, value);
		if (this.#scheduledGuildSubUpdateTimeout) clearTimeout(this.#scheduledGuildSubUpdateTimeout);

		this.#scheduledGuildSubUpdateTimeout = setTimeout(() => {
			let temp: Record<string, Partial<guildSubscription>> = {},
				jsonLen = 0;

			for (const [id, value] of Object.entries(this.#scheduledGuildSubUpdates)) {
				const newLen = JSON.stringify([id, value]).length;
				if (newLen > guildSubscriptionUpdateMaxSize) {
					logger.warn("Guild subscription update too large:", id, value);
					return;
				}
				if (jsonLen + newLen > guildSubscriptionUpdateMaxSize) {
					this.#send(OPCodes.GUILD_SUBSCRIPTIONS_BULK, {
						subscriptions: temp,
					});
					temp = {};
					jsonLen = 0;
				}
				temp[id] = value;
				jsonLen += newLen;
			}

			if (jsonLen) {
				this.#send(OPCodes.GUILD_SUBSCRIPTIONS_BULK, {
					subscriptions: temp,
				});
			}
		}, 10);
	}
}
