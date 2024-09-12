export const enum PremiumTypes {
	NONE = 0,
	NITRO_BASIC = 1, // basic & classic
	NITRO = 2,
}

export enum PlatformTypes {
	TWITCH = "twitch",
	YOUTUBE = "youtube",
	SKYPE = "skype",
	STEAM = "steam",
	LEAGUE_OF_LEGENDS = "leagueoflegends",
	BATTLENET = "battlenet",
	REDDIT = "reddit",
	TWITTER = "twitter",
	SPOTIFY = "spotify",
	FACEBOOK = "facebook",
	XBOX = "xbox",
	SAMSUNG = "samsung",
	CONTACTS = "contacts",
	INSTAGRAM = "instagram",
	SOUNDCLOUD = "soundcloud",
	GITHUB = "github",
	PLAYSTATION = "playstation",
}

export const enum RelationshipTypes {
	NONE,
	FRIEND,
	BLOCKED,
	PENDING_INCOMING,
	PENDING_OUTGOING,
	IMPLICIT,
	SUGGESTION,
}

export const enum ActivityTypes {
	PLAYING,
	STREAMING,
	LISTENING,
	WATCHING,
	CUSTOM,
	COMPETING,
	HANG_STATUS,
}
