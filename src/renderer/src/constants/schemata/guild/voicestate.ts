import { boolean, nullable, object, string } from "valibot";

export default object({
	channel_id: string(),
	deaf: boolean(),
	mute: boolean(),
	request_to_speak_timestamp: nullable(string()),
	self_deaf: boolean(),
	self_mute: boolean(),
	self_video: boolean(),
	session_id: string(),
	suppress: boolean(),
	user_id: string(),
});
