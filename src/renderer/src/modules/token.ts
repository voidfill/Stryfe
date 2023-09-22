import Logger from "@modules/logger";
import Storage from "@modules/storage";

const tokenRegex = /\S+\.\S+\.\S+/;
let token: string | null = null;

async function ensureEncryption(): Promise<boolean> {
	if (await window.ipc.isEncryptionAvailable()) return true;
	throw new Error("Encryption is not available");
}

export function isValidToken(token: string): boolean {
	return tokenRegex.test(token);
}

export async function getToken(): Promise<string | null> {
	if (token) return token;
	if (!Storage.has("token")) return null;
	await ensureEncryption();

	token = await window.ipc.decrypt(Storage.get("token", ""));
	if (!isValidToken(token)) {
		Logger.error("Invalid token stored in storage, clearing.");
		clearToken();
	}

	return token;
}

export async function setToken(newToken: string): Promise<void> {
	token = newToken;
	await ensureEncryption();
	Storage.set("token", await window.ipc.encrypt(newToken));
	window.location = "/" as string & Location;
}

export function clearToken(): void {
	Storage.delete("token");
	window.location = "/" as string & Location;
}
