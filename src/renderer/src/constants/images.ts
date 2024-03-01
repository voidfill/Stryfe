export const imageSizes = Object.freeze([16, 32, 64, 128, 256, 512, 1024, 2048, 4096] as const);

export type validSizeType = (typeof imageSizes)[number];

export function validSize(size: number): validSizeType {
	if (imageSizes.includes(size as validSizeType)) {
		return size as validSizeType;
	}

	if (size < 16) {
		return 16;
	}
	if (size > 4096) {
		return 4096;
	}

	return imageSizes.find((s) => s > size) as validSizeType;
}

export const cdnBaseURL = "https://cdn.discordapp.com";

export function emojiURL(id: string, size: number, animated = false): string {
	return `${cdnBaseURL}/emojis/${id}.${animated ? "gif" : "webp"}?size=${validSize(size)}&quality=lossless`;
}

export function guildIconURL(id: string, hash: string, size: number, animated = false): string {
	return `${cdnBaseURL}/icons/${id}/${hash}.${animated ? "gif" : "webp"}?size=${validSize(size)}`;
}

export function userAvatarURL(id: string, hash: string, size: number, animated = false): string {
	return `${cdnBaseURL}/avatars/${id}/${hash}.${animated ? "gif" : "webp"}?size=${validSize(size)}`;
}

export function guildMemberAvatarURL(guildId: string, userId: string, hash: string, size: number, animated = false): string {
	return `${cdnBaseURL}/guilds/${guildId}/users/${userId}/avatars/${hash}.${animated ? "gif" : "webp"}?size=${validSize(size)}`;
}

export function channelIconURL(id: string, hash: string, size: number): string {
	return `${cdnBaseURL}/channel-icons/${id}/${hash}.webp?size=${validSize(size)}`;
}
