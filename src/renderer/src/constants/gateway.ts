import { Output } from "valibot";

import { dispatches as __allDispatches } from "@constants/schemata";

export const enum OPCodes {
	DISPATCH,
	HEARTBEAT,
	IDENTIFY,
	PRESENCE_UPDATE,
	VOICE_STATE_UPDATE,
	VOICE_SERVER_PING,
	RESUME,
	RECONNECT,
	REQUEST_GUILD_MEMBERS,
	INVALID_SESSION,
	HELLO,
	HEARTBEAT_ACK,
	SYNC_GUILDS,
	CALL_CONNECT,
	GUILD_SUBSCRIPTIONS,
	LOBBY_CONNECT,
	LOBBY_DISCONNECT,
	LOBBY_VOICE_STATES_UPDATE,
	STREAM_CREATE,
	STREAM_DELETE,
	STREAM_WATCH,
	STREAM_PING,
	STREAM_SET_PAUSED,
	REQUEST_GUILD_APPLICATION_COMMANDS = 24,
	EMBEDDED_ACTIVITY_LAUNCH,
	EMBEDDED_ACTIVITY_CLOSE,
	EMBEDDED_ACTIVITY_UPDATE,
	REQUEST_FORUM_UNREADS,
	REMOTE_COMMAND,
	GET_DELETED_ENTITY_IDS_NOT_MATCHING_HASH,
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
				d: Output<(typeof __allDispatches)[key]>;
				op: OPCodes.DISPATCH;
				s: number;
				t: key;
			};
	  }[keyof typeof __allDispatches];
