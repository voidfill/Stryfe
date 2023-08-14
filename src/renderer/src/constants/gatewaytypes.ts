import { ChannelTypes } from "./channel";
import { PremiumTypes, PlatformTypes } from "./user";

export type id_able = {
	id: string;
};

// TODO: finish
// TODO: all unknowns should be typed

export type guild_scheduled_event = id_able & unknown;
export type stage_instance = id_able & unknown;

// ------------------------------ //

export type guildMember = {
	avatar?: string | null;
	communication_disabled_until?: string | null;
	deaf: boolean;
	flags?: number;
	joined_at: string;
	mute: boolean;
	nick?: string | null;
	pending?: boolean;
	permissions?: string;
	premium_since?: string | null;
	roles: string[];
	user?: user;
};

export type relationship = {
	id: string;
	nickname?: string | null;
	since?: number;
	type: number;
};

export type merged_member = Omit<guildMember, "user"> & {
	user_id: string;
};

export type connected_account = id_able & {
	access_token: string;
	friend_sync: boolean;
	metadata_visibility?: boolean;
	name: string;
	revoked: boolean;
	show_activity: boolean;
	two_way_link: false;
	type: PlatformTypes;
	verified: boolean;
	visibility: number;
};

export type user = id_able & {
	accent_color?: number | null;
	avatar: string | null;
	avatar_decoration?: string | null;
	banner?: string | null;
	banner_color?: string | null;
	bio?: string | null;
	bot?: boolean;
	discriminator: string;
	email?: string | null;
	flags?: number;
	locale?: string;
	mfa_enabled?: boolean;
	premium_type?: PremiumTypes;
	public_flags?: number;
	system?: boolean;
	username: string;
	verified?: boolean;
};

export type activity = {
	application_id?: string;
	assets?: {
		large_image?: string;
		large_text?: string;
		small_image?: string;
		small_text?: string;
	};
	buttons?: {
		label: string;
		url: string;
	}[];
	created_at: number;
	details?: string | null;
	emoji?: {
		animated?: boolean;
		id?: string;
		name: string;
	} | null;
	flags?: number;
	id?: string;
	instance?: boolean;
	name: string;
	party?: {
		id?: string;
		size?: [number, number];
	};
	secrets?: {
		join?: string;
		match?: string;
		spectate?: string;
	};
	session_id?: string;
	state?: string | null;
	sync_id?: string;
	timestamps?: {
		end?: number;
		start?: number;
	};
	type: number;
	url?: string | null;
};

export type Status = "online" | "idle" | "dnd" | "invisible";

export type session = {
	active?: boolean;
	activities: activity[];
	client_info: {
		client: string;
		os: string;
		version: number;
	};
	session_id: string;
	status: Status;
};

export type role = id_able & {
	color: number;
	flags: number;
	hoist: boolean;
	icon: string | null;
	managed: boolean;
	mentionable: boolean;
	name: string;
	permissions: string;
	position: number;
	tags: unknown;
	unicode_emoji: string | null;
};

export type emoji = {
	animated: boolean;
	available: boolean;
	id: string | null;
	managed?: boolean;
	name: string | null;
	require_colons: boolean;
	roles?: string[];
	version?: number;
};

export type sticker = id_able & {
	asset?: string; // deprecated
	available?: boolean;
	description: string;
	format_type: number;
	guild_id?: string;
	name: string;
	pack_id?: string;
	tags: string;
	type: number;
	user?: user;
	version?: number;
};

export type forum_tag = {
	emoji_id: string | null;
	emoji_name: string | null;
	id: string;
	moderated: boolean;
	name: string;
};

export type permission_overwrite = {
	allow: string;
	deny: string;
	id: string;
	type: 0 | 1;
};

export type thread_metadata = {
	archive_timestamp: string;
	archived: boolean;
	auto_archive_duration: number;
	create_timestamp?: string | null;
	invitable?: boolean;
	locked: boolean;
};

export type thread_member = id_able & {
	flags: number;
	join_timestamp: string;
	user_id?: string;
};

export type thread_self_member = {
	flags: number;
	join_timestamp: string;
	mute_config: any | null; // <---
	muted: boolean;
};

export type direct_message = id_able & {
	flags: number;
	last_message_id?: string | null;
	recipient_ids: [string];
	type: ChannelTypes.DM;
};

export type group_direct_message = id_able & {
	flags: number;
	icon: string | null;
	last_message_id?: string | null;
	name: string | null;
	owner_id: string;
	recipient_ids: string[];
	type: ChannelTypes.GROUP_DM;
};

export type guild_text = id_able & {
	flags: number;
	last_message_id?: string | null;
	last_pin_timestamp?: string;
	name: string;
	nsfw?: boolean;
	parent_id?: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	rate_limit_per_user: number;
	topic: string | null;
	type: ChannelTypes.GUILD_TEXT;
};

export type guild_voice = id_able & {
	bitrate: number;
	flags: number;
	last_message_id?: string | null;
	name: string;
	parent_id?: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	rate_limit_per_user: number;
	rtc_region: string | null;
	type: ChannelTypes.GUILD_VOICE;
	user_limit: number;
};

export type guild_stage_voice = Omit<guild_voice, "type"> & {
	nsfw?: boolean;
	type: ChannelTypes.GUILD_STAGE_VOICE;
};

export type guild_category = id_able & {
	flags: number;
	name: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	type: ChannelTypes.GUILD_CATEGORY;
};

export type guild_announcement = id_able & {
	flags: number;
	last_message_id?: string | null;
	last_pin_timestamp?: string;
	name: string;
	nsfw?: boolean;
	parent_id?: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	rate_limit_per_user: number;
	topic: string | null;
	type: ChannelTypes.GUILD_ANNOUNCEMENT;
};

// idk
export type guild_directory = id_able & {
	flags: number;
	last_message_id?: string | null;
	name: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	topic: string | null;
	type: ChannelTypes.GUILD_DIRECTORY;
};

export type guild_forum = id_able & {
	available_tags: forum_tag[];
	default_auto_archive_duration: number;
	default_forum_layout: number;
	default_reaction_emoji: {
		emoji_id: string | null;
		emoji_name: string | null;
	};
	default_sort_order: 0 | 1 | null;
	default_thread_rate_limit_per_user: number;
	flags: number;
	last_message_id?: string | null;
	name: string;
	nsfw?: boolean;
	parent_id?: string;
	permission_overwrites: permission_overwrite[];
	position: number;
	rate_limit_per_user: number;
	template: string;
	topic?: string | null;
	type: ChannelTypes.GUILD_FORUM;
};

export type public_thread = id_able & {
	flags: number;
	guild_id: string;
	last_message_id?: string | null;
	member?: thread_self_member;
	member_count: number;
	member_ids_preview?: string[];
	message_count: number;
	name: string;
	owner_id: string;
	parent_id: string;
	rate_limit_per_user: number;
	thread_metadata: thread_metadata;
	total_message_sent?: number;
	type: ChannelTypes.PUBLIC_THREAD;
};

export type private_thread = Omit<public_thread, "type"> & {
	type: ChannelTypes.PRIVATE_THREAD;
};

export type announcement_thread = Omit<public_thread, "type"> & {
	type: ChannelTypes.ANNOUNCEMENT_THREAD;
};

export type guild_channel = guild_text | guild_voice | guild_stage_voice | guild_category | guild_announcement | guild_directory | guild_forum;
export type thread = public_thread | private_thread | announcement_thread;
export type private_channel = direct_message | group_direct_message;

export type ready_guild_properties = {
	afk_channel_id: string | null;
	afk_timeout: number;
	application_id: string | null;
	banner: string | null;
	default_message_notifications: number;
	description: string | null;
	discovery_splash: string | null;
	explicit_content_filter: number;
	features: string[];
	home_header: any | null;
	hub_type: any | null;
	icon: string | null;
	max_members: number;
	max_stage_video_channel_users: number;
	max_video_channel_users: number;
	mfa_level: number;
	name: string;
	nsfw?: boolean;
	nsfw_level: number;
	owner_id: string;
	preferred_locale: string | null;
	premium_progress_bar_enabled: boolean;
	premium_tier: number;
	public_updates_channel_id: string | null;
	rules_channel_id: string | null;
	safety_alerts_channel_id: string | null;
	splash: string | null;
	system_channel_flags: number;
	system_channel_id: string | null;
	vanity_url_code: string | null;
	verification_level: number;
	version?: number;
	widget_channel_id?: string | null;
	widget_enabled?: boolean;
};

export type ready_guild = id_able & {
	application_command_counts: unknown;
	channels: guild_channel[];
	data_mode: "full" | "partial";
	emojis: emoji[];
	guild_scheduled_events: guild_scheduled_event[];
	joined_at: string;
	large: boolean;
	lazy: boolean;
	member_count: number;
	premium_subscription_count: number;
	properties: ready_guild_properties;
	roles: role[];
	stage_instances: stage_instance[];
	stickers: sticker[];
	threads: thread[];
	unavailable?: false; // doesnt exist but we kinda want it for type safety
	version: string;
};

export type unavailable_guild = id_able & {
	unavailable: true;
};

export type user_self = user & {
	desktop: boolean;
	mobile: boolean;
	nsfw_allowed: boolean;
	phone: string | null;
	premium: boolean;
	purchased_flags: number;
};

export type channel_override = {
	channel_id: string;
	collapsed: boolean;
	message_notifications: number;
	mute_config: {
		end_time: string | null;
		selected_time_window: number;
	} | null;
	muted: boolean;
};

export type user_guild_setting = {
	channel_overrides: channel_override[];
	flags: number;
	guild_id: string;
	hide_muted_channels: boolean;
	message_notifications: number;
	mobile_push: boolean;
	mute_config: {
		end_time: string | null;
		selected_time_window: number;
	} | null;
	mute_scheduled_events: boolean;
	muted: boolean;
	notify_highlights: number;
	suppresss_everyone: boolean;
	suppresss_roles: boolean;
	version: number;
};

// dispatches

export type __all = {
	CHANNEL_CREATE: CHANNEL_CREATE;
	CHANNEL_DELETE: CHANNEL_DELETE;
	CHANNEL_PINS_UPDATE: CHANNEL_PINS_UPDATE;
	CHANNEL_RECIPIENT_ADD: CHANNEL_RECIPIENT_ADD;
	CHANNEL_RECIPIENT_REMOVE: CHANNEL_RECIPIENT_REMOVE;
	CHANNEL_UPDATE: CHANNEL_UPDATE;
	GUILD_CREATE: GUILD_CREATE;
	GUILD_DELETE: GUILD_DELETE;
	GUILD_UPDATE: GUILD_UPDATE;
	READY: READY;
	THREAD_CREATE: THREAD_CREATE;
	THREAD_DELETE: THREAD_DELETE;
	THREAD_LIST_SYNC: THREAD_LIST_SYNC;
	THREAD_MEMBER_UPDATE: THREAD_MEMBER_UPDATE;
	THREAD_UPDATE: THREAD_UPDATE;
};

export type READY = {
	_trace: string[];
	analytics_token?: string;
	api_code_version?: number;
	auth_session_id_hash: string;
	connected_accounts: connected_account[];
	consents: unknown;
	country_code: string;
	experiments: unknown;
	friend_suggestion_count: number;
	geo_ordered_rtc_regions: string[];
	guild_experiments: unknown;
	guild_join_requests: unknown[];
	guilds: (ready_guild | unavailable_guild)[];
	merged_members: [merged_member][];
	private_channels: private_channel[];
	read_state: unknown;
	relationships: (relationship & {
		user_id: string;
	})[];
	resume_gateway_url: string;
	session_id: string;
	session_type?: string;
	sessions: session[];
	tutorial: unknown;
	user: user_self;
	user_guild_settings: {
		entries: user_guild_setting[];
		partial: boolean;
		version: number;
	};
	user_settings_proto: string;
	users: user[];
	v: number;
};

export type GUILD_CREATE =
	| unavailable_guild
	| (id_able & {
			application_command_counts: any;
			channels: unknown[];
			data_mode: "full" | "partial"; //TODO: check
			embedded_activities: unknown[];
			emojis: emoji[];
			guild_scheduled_events: guild_scheduled_event[];
			joined_at: string;
			large: boolean;
			lazy: boolean;
			member_count: number;
			members: guildMember[];
			premium_subscription_count: number;
			presences: unknown[];
			properties: ready_guild_properties;
			roles: role[];
			stage_instances: stage_instance[];
			stickers: sticker[];
			threads: unknown[];
			unavailable?: false;
			version: number;
			voice_states: unknown[];
	  });

export type GUILD_UPDATE = ready_guild_properties & {
	guild_hashes: unknown;
	hashes: unknown;
	id: string;
};

export type GUILD_DELETE = {
	id: string;
	unavailable: boolean;
};

export type CHANNEL_CREATE =
	| (guild_channel & {
			guild_id: string;
	  })
	| (Omit<private_channel, "recipient_ids"> & {
			recipients: user[];
	  });

export type CHANNEL_UPDATE = (guild_channel | private_channel) & {
	guild_id?: string;
};

export type CHANNEL_DELETE = {
	guild_id?: string;
	id: string;
};

export type CHANNEL_PINS_UPDATE = {
	channel_id: string;
	guild_id?: string;
	last_pin_timestamp?: string | null;
};

export type CHANNEL_RECIPIENT_ADD = {
	channel_id: string;
	user: user;
};

export type CHANNEL_RECIPIENT_REMOVE = {
	channel_id: string;
	user: user;
};

export type THREAD_CREATE = thread & {
	newly_created?: boolean;
};

export type THREAD_UPDATE = thread;

export type THREAD_DELETE = {
	guild_id: string;
	id: string;
	parent_id?: string;
	type: thread["type"];
};

export type THREAD_LIST_SYNC = {
	channel_ids?: string[];
	guild_id: string;
	members: thread_member[];
	threads: thread[];
};

export type THREAD_MEMBER_UPDATE = thread_member & {
	guild_id: string;
};
