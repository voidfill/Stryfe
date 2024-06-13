import { InferOutput } from "valibot";

import { dispatches as __allDispatches } from "@constants/schemata";

export const enum OPCodes {
	DISPATCH = 0,
	HEARTBEAT = 1,
	IDENTIFY = 2,
	PRESENCE_UPDATE = 3,
	VOICE_STATE_UPDATE = 4,
	VOICE_SERVER_PING = 5,
	RESUME = 6,
	RECONNECT = 7,
	REQUEST_GUILD_MEMBERS = 8,
	INVALID_SESSION = 9,
	HELLO = 10,
	HEARTBEAT_ACK = 11,
	SYNC_GUILDS = 12,
	CALL_CONNECT = 13,
	GUILD_SUBSCRIPTIONS = 14,
	LOBBY_CONNECT = 15,
	LOBBY_DISCONNECT = 16,
	LOBBY_VOICE_STATES_UPDATE = 17,
	STREAM_CREATE = 18,
	STREAM_DELETE = 19,
	STREAM_WATCH = 20,
	STREAM_PING = 21,
	STREAM_SET_PAUSED = 22,
	REQUEST_GUILD_APPLICATION_COMMANDS = 24,
	EMBEDDED_ACTIVITY_LAUNCH = 25,
	EMBEDDED_ACTIVITY_CLOSE = 26,
	EMBEDDED_ACTIVITY_UPDATE = 27,
	REQUEST_FORUM_UNREADS = 28,
	REMOTE_COMMAND = 29,
	GET_DELETED_ENTITY_IDS_NOT_MATCHING_HASH = 30,
	REQUEST_SOUNDBOARD_SOUNDS = 31,
	SPEED_TEST_CREATE = 32,
	SPEED_TEST_DELETE = 33,
	REQUEST_LAST_MESSAGES = 34,
	SEARCH_RECENT_MEMBERS = 35,
	REQUEST_CHANNEL_STATUSES = 36,
	GUILD_SUBSCRIPTIONS_BULK = 37,
}

export const enum SocketGatewayCloseCodes {
	UNKNOWN_ERROR = 4000,
	UNKNOWN_OPCODE = 4001,
	DECODE_ERROR = 4002,
	NOT_AUTHENTICATED = 4003,
	AUTHENTICATION_FAILED = 4004,
	ALREADY_AUTHENTICATED = 4005,
	INVALID_SEQUENCE = 4007,
	RATE_LIMITED = 4008,
	SESSION_TIMEOUT = 4009,
	INVALID_SHARD = 4010,
	SHARDING_REQUIRED = 4011,
	INVALID_API_VERSION = 4012,
	INVALID_INTENTS = 4013,
	DISALLOWED_INTENTS = 4014,
}

export const recoverableCloseCodes: {
	[key in SocketGatewayCloseCodes]: boolean;
} = {
	[SocketGatewayCloseCodes.UNKNOWN_ERROR]: true,
	[SocketGatewayCloseCodes.UNKNOWN_OPCODE]: true,
	[SocketGatewayCloseCodes.DECODE_ERROR]: true,
	[SocketGatewayCloseCodes.NOT_AUTHENTICATED]: true,
	[SocketGatewayCloseCodes.AUTHENTICATION_FAILED]: false,
	[SocketGatewayCloseCodes.ALREADY_AUTHENTICATED]: true,
	[SocketGatewayCloseCodes.INVALID_SEQUENCE]: true,
	[SocketGatewayCloseCodes.RATE_LIMITED]: true,
	[SocketGatewayCloseCodes.SESSION_TIMEOUT]: true,
	[SocketGatewayCloseCodes.INVALID_SHARD]: false,
	[SocketGatewayCloseCodes.SHARDING_REQUIRED]: false,
	[SocketGatewayCloseCodes.INVALID_API_VERSION]: false,
	[SocketGatewayCloseCodes.INVALID_INTENTS]: false,
	[SocketGatewayCloseCodes.DISALLOWED_INTENTS]: false,
};

export type GatewayPayload =
	| {
			d: any;
			op: Exclude<OPCodes, OPCodes.DISPATCH>;
			s: null;
			t: null;
	  }
	| {
			[key in keyof typeof __allDispatches]: {
				d: InferOutput<(typeof __allDispatches)[key]>;
				op: OPCodes.DISPATCH;
				s: number;
				t: key;
			};
	  }[keyof typeof __allDispatches];
