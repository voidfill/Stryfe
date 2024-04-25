import { array, boolean, merge, nullable, object, omit, optional, string } from "valibot";

import member from "./member";

const voice_state = object({
	channel_id: string(),
	deaf: boolean(),
	guild_id: optional(nullable(string())),
	member: optional(member),
	mute: boolean(),
	request_to_speak_timestamp: optional(nullable(string())),
	self_deaf: boolean(),
	self_mute: boolean(),
	self_stream: optional(boolean()),
	self_video: boolean(),
	session_id: string(),
	suppress: boolean(),
	user_id: string(),
});

export default voice_state;

export const VOICE_STATE_UPDATE = merge([omit(voice_state, ["channel_id"]), object({ channel_id: nullable(string()) })]);

export const CALL_CREATE = object({
	channel_id: string(),
	message_id: string(),
	region: string(),
	ringing: nullable(array(string())),
	voice_states: nullable(array(voice_state)),
});

export const CALL_DELETE = object({
	channel_id: string(),
});
