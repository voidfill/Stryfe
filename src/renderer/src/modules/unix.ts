export const DISCORD_EPOCH = 14200705e5;

export function extractTimeStamp(unix: string): Date {
	return new Date(Math.floor(Number(unix) / (2 << 21)) + DISCORD_EPOCH);
}

export function toUnix(time: Date | number): string {
	const lower = BigInt(Number(time) - DISCORD_EPOCH);
	return lower <= 0 ? "0" : (lower << 22n).toString();
}
