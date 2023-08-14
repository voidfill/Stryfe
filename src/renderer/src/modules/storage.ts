import logger from "./logger";

export default class Storage {
	static has(key: string): boolean {
		return !!localStorage.getItem(key);
	}

	static get<T>(key: string, fallback: T): T {
		const value = localStorage.getItem(key);
		if (value === null) return fallback;

		try {
			return JSON.parse(value) as T;
		} catch (e) {
			logger.warn("Failed to parse item from storage:", e);
			return fallback;
		}
	}

	static set(key: string, value: any): void {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			logger.error("Failed to set item in storage:", e);
		}
	}

	static delete(key: string): void {
		localStorage.removeItem(key);
	}
}
