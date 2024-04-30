import Logger from "@modules/logger";

import { del, get, set } from "idb-keyval";

const tokenRegex = /\S+\.\S+\.\S+/;
let token: string | null = null;

async function ensureEncryption(): Promise<boolean> {
	if (await window.ipc.isEncryptionAvailable()) return true;
	throw new Error("Encryption is not available");
}

export function isValidToken(token: string): boolean {
	return tokenRegex.test(token) && /\d+/.test(atob(token.split(".")[0]));
}

export async function getToken(): Promise<string | null> {
	if (token) return token;
	const t = await get("token");
	if (!t || typeof t !== "string") return null;
	await ensureEncryption();

	token = await window.ipc.decrypt(t);
	if (!isValidToken(token)) {
		Logger.error("Invalid token stored in storage, clearing.");
		clearToken();
		return null;
	}

	return token;
}

export async function setToken(newToken: string): Promise<void> {
	token = newToken;
	await ensureEncryption();
	await set("token", await window.ipc.encrypt(newToken));
	window.location = "" as string & Location;
}

export async function getUserIdFromToken(): Promise<string | null> {
	const token = await getToken();
	if (!token) return null;
	return atob(token.split(".")[0]);
}

export function clearToken(): void {
	del("token").then(() => {
		window.location = "" as string & Location;
	});
}
