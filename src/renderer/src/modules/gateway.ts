import pako from "pako";

import { Logger } from "./logger";
import Dispatcher from "./dispatcher";
import { clearToken } from "./token";
import { OPCodes, GatewayPayload, SocketGatewayCloseCodes, gatewayDispatchesObj as validDispatches } from "@constants/gateway";
import { ClientProperties } from "./discordversion";

const logger = new Logger("WebSocket", "blue");

const enum ConnectionState {
	Disconnected,
	Connecting,
	Connected,
	Resuming,
}

const HELLO_TIMEOUT = 20_000,
	HEARTBEAT_MAX_RESUME_THRESHOLD = 60 * 3 * 1000,
	MAX_RETRIES = 20,
	native_build_number = 34898,
	capabilities = 16381;

export type gatewayDispatches = {
	GATEWAY_CONNECT: undefined;
	GATEWAY_DISCONNECT: undefined;
	GATEWAY_GIVE_UP: undefined;
};

export default class GatewaySocket {
	#gatewayURL = "wss://gateway.discord.gg";
	#gatewayVersion: number;
	#token: string;
	#clientProperties: ClientProperties;

	#state: ConnectionState = ConnectionState.Disconnected;
	#socket: WebSocket | null = null;
	#inflate: pako.Inflate;
	#inflate_chunks: Uint8Array[] = [];

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

	#trace: string[] = [];

	get sessionId(): string | null {
		return this.#sessionId;
	}

	get trace(): string[] {
		return this.#trace;
	}

	get canResume(): boolean {
		return !!this.#sessionId && Date.now() - (this.#heart.lastAck ?? 0) < HEARTBEAT_MAX_RESUME_THRESHOLD;
	}

	constructor(token: string, clientProperties: ClientProperties, gatewayVersion = 9) {
		this.#token = token;
		this.#clientProperties = clientProperties;
		this.#gatewayVersion = gatewayVersion;

		this.#makeInflator();
		this.#createSocket();
	}

	#makeInflator(): void {
		this.#inflate = new pako.Inflate({
			chunkSize: 65536,
		});
		this.#inflate_chunks = [];
		this.#inflate.onData = (data: Uint8Array): void => void this.#inflate_chunks.push(data);
	}

	#createSocket(): void {
		if (this.#state === ConnectionState.Connected || this.#state === ConnectionState.Connecting) return;
		this.#state = ConnectionState.Connecting;
		this.#seq = 0;
		this.#attempts++;
		this.#makeInflator();
		if (this.#socket?.readyState === WebSocket.OPEN) this.#socket.close();

		this.#helloTimeout = setTimeout(() => {
			this.#socket?.close(SocketGatewayCloseCodes.UNKNOWN_ERROR, "Hello timeout");
		}, HELLO_TIMEOUT);
		this.#socket = new WebSocket(`${this.#gatewayURL}/?v=${this.#gatewayVersion}&compress=zlib-stream&encoding=etf`);
		this.#socket.binaryType = "arraybuffer";

		this.#socket.addEventListener("message", this.#handleMessage.bind(this));
		this.#socket.addEventListener("open", this.#onOpen.bind(this));
		this.#socket.addEventListener("close", this.handleClose.bind(this));
		this.#socket.addEventListener("error", this.#handleError.bind(this));
	}

	async #handleMessage({ data }: MessageEvent<ArrayBuffer>): Promise<void> {
		const len = data.byteLength,
			doFlush = len >= 4 && new DataView(data).getUint32(len - 4, false) === 65535;
		this.#inflate.push(new Uint8Array(data), doFlush && pako.Z_SYNC_FLUSH);
		if (this.#inflate.err) logger.error("Failed to inflate message:", this.#inflate.msg);

		if (doFlush && !this.#inflate.err) {
			const rlen = this.#inflate_chunks.reduce((a, b) => a + b.byteLength, 0);
			const buf = new Uint8Array(rlen);
			let offset = 0;
			for (const chunk of this.#inflate_chunks) {
				buf.set(chunk, offset);
				offset += chunk.byteLength;
			}
			this.#inflate_chunks = [];
			window.ipc.unpack(buf).then(this.#onData.bind(this));
		}
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
				api_code_version: 0,
				guild_versions: {},
				highest_last_message_id: "0",
				initial_guild_id: undefined,
				private_channels_version: "0",
				read_state_version: 0,
				user_guild_settings_version: -1,
				user_settings_version: -1,
			},
			compress: false,
			presence: {
				activities: [],
				afk: false,
				broadcast: undefined,
				since: 0,
				status: "unknown",
			},
			properties: {
				browser: "Discord Client",
				browser_user_agent: navigator.userAgent + " discord/" + this.#clientProperties.version,
				client_build_number: this.#clientProperties.build_number,
				client_event_source: null,
				client_version: this.#clientProperties.version,
				native_build_number: native_build_number,
				os: window.os_type,
				os_arch: window.os.arch(),
				os_version: window.os.release(),
				release_channel: "stable",
				system_locale: "en-US",
			},
			token: this.#token,
		});
	}

	#onData(data: GatewayPayload): void {
		switch (data.op) {
			case OPCodes.DISPATCH:
				this.#seq = data.s;

				if (!validDispatches[data.t]) logger.warn("Dispatch unaccounted for:", data.t, data.d);

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
						Dispatcher.emit("GATEWAY_CONNECT");
				}

				// @ts-expect-error were not gonna validate this
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
					this.#onOpen();
				} else {
					this.#identify();
				}
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
				if (!this.#heart.ack) this.#socket?.close(SocketGatewayCloseCodes.UNKNOWN_ERROR, "Heartbeat timeout");
				this.#send(OPCodes.HEARTBEAT, this.#seq);
			}, interval),
			interval,
			lastAck: Date.now(),
		});
	}

	#stopHeartbeat(): void {
		this.#heart.beat &&= clearInterval(this.#heart.beat) as undefined;
	}

	async #send(opcode: OPCodes, data: any): Promise<void> {
		if (this.#socket?.readyState !== WebSocket.OPEN) return logger.warn("Attempted to send message while socket is not open");
		if (this.#state !== ConnectionState.Connected && this.#state !== ConnectionState.Connecting && this.#state !== ConnectionState.Resuming)
			return logger.warn("Attempted to send message while not connected");

		try {
			logger.info("Sending message:", opcode, data);
			this.#socket.send(
				await window.ipc.pack({
					d: data,
					op: opcode,
				}),
			);
		} catch (error) {
			logger.error("Failed to send message:", error);
		}
	}
}
