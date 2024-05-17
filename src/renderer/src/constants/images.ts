import { StickerFormatType } from "./schemata/guild/sticker";

export const imageSizes = Object.freeze([
	16, 20, 22, 24, 28, 32, 40, 44, 48, 56, 60, 64, 80, 96, 100, 128, 160, 240, 256, 300, 320, 480, 512, 600, 640, 1024, 1280, 1536, 2048, 3072, 4096,
] as const);

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
export const mediaBaseURL = "https://media.discordapp.net";

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

export function stickerURL(id: string, format: StickerFormatType, size: number, animated = false): string {
	size = validSize(size);
	switch (format) {
		case StickerFormatType.PNG:
			return `${mediaBaseURL}/stickers/${id}.webp?size=${size}`;
		case StickerFormatType.APNG:
			return `${mediaBaseURL}/stickers/${id}.png?size=${size}${animated ? "" : "&passthrough=false"}`;
		case StickerFormatType.LOTTIE:
			return `https://discord.com/stickers/${id}.json`;
		case StickerFormatType.GIF:
			return `${mediaBaseURL}/stickers/${id}.gif?size=${size}`;
	}
}
