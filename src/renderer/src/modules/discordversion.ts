import Storage from "./storage";

const invalidTimeout = 1000 * 60 * 60 * 24;
function isValidTime(time: number): boolean {
	return Date.now() - time < invalidTimeout;
}
const url = "https://cordapi.dolfi.es/api/v2/properties/" + window.os_type.toLowerCase();

export async function getSuper(): Promise<string> {
	return new Promise((resolve, reject) => {
		let didResolve = false;

		if (Storage.has("super_properties")) {
			const c = Storage.get("super_properties", ["", 0] as [string, number]);
			if (c[0] && isValidTime(c[1])) (didResolve = true) && resolve(c[0]);
		}

		fetch(url, {
			method: "POST",
		}).then((r) => {
			if (!r.ok) return !didResolve && reject("Invalid response");
			return r.text().then((r) => {
				if (!r) return !didResolve && reject("Invalid response");
				Storage.set("super_properties", [r, Date.now()]);
				!didResolve && resolve(r);
			});
		});
	});
}

export type ClientProperties = {
	build_hash: string;
	build_number: number;
	release_channel: string;
	type: string;
	version: string;
};
export async function getClientProps(): Promise<ClientProperties> {
	return new Promise((resolve, reject) => {
		let didResolve = false;

		if (Storage.has("client_properties")) {
			const c = Storage.get("client_properties", [{}, 0] as [ClientProperties, number]);
			if (c[0].build_number && c[0].version && isValidTime(c[1])) (didResolve = true) && resolve(c[0]);
		}

		fetch(url).then((r) => {
			if (!r.ok) return !didResolve && reject("Invalid response");
			return r.json().then((r) => {
				r = r.client;
				if (!r.build_number || !r.version) {
					return !didResolve && reject("Invalid response");
				}
				Storage.set("client_properties", [r, Date.now()]);
				!didResolve && resolve(r);
			});
		});
	});
}
