import Storage from "./storage";

import { object, Output, safeParse, string } from "valibot";

const invalidTimeout = 1000 * 60 * 60 * 24;
function isValidTime(time: number): boolean {
	return Date.now() - time < invalidTimeout;
}
const url = "https://cordapi.dolfi.es/api/v2/properties/" + window.os_type.toLowerCase();

// const getPropsClient = object({
// 	build_hash: string(),
// 	build_number: number(),
// 	release_channel: string(),
// 	type: string(),
// 	version: string(),
// });
// const getProps = object({
// 	client: getPropsClient,
// });

const superProps = object({
	encoded: string(),
	properties: object({}),
});

let alreadyFetchedProps: Output<typeof superProps>;

export type clientProperties = Output<typeof superProps>["properties"];

// TODO: Dolfies please i need your api :sob:

const hardcodedProps =
	"eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDMwIiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MjEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJpYTMyIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV09XNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIGRpc2NvcmQvMS4wLjkwMzAgQ2hyb21lLzEwOC4wLjUzNTkuMjE1IEVsZWN0cm9uLzIyLjMuMjYgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjIyLjMuMjYiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoyNjA3MjUsIm5hdGl2ZV9idWlsZF9udW1iZXIiOjQyNjU2LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==";

window.ipc.setUserAgent(JSON.parse(atob(hardcodedProps)).browser_user_agent);

export async function getSuper(): Promise<Output<typeof superProps>> {
	return new Promise((resolve, reject) => {
		resolve({
			encoded: hardcodedProps,
			properties: JSON.parse(atob(hardcodedProps)),
		});
	});
}

// export async function getSuper(): Promise<Output<typeof superProps>> {
// 	return new Promise((resolve, reject) => {
// 		if (alreadyFetchedProps) return resolve(alreadyFetchedProps);
// 		let didResolve = false;

// 		if (Storage.has("super_properties")) {
// 			const c = Storage.get("super_properties", [{}, 0] as [Output<typeof superProps>, number]);
// 			const sp = safeParse(superProps, c[0]);
// 			if (!sp.success) {
// 				console.error("Failed to parse super props:", sp, c);
// 				throw "Failed to parse super props";
// 			}
// 			if (isValidTime(c[1])) (didResolve = true) && resolve(c[0]);
// 		}

// 		fetch(url, {
// 			method: "POST",
// 		}).then((r) => {
// 			if (!r.ok) return !didResolve && reject("Invalid response");
// 			return r.json().then((r: Output<typeof superProps>) => {
// 				const sp = safeParse(superProps, r);
// 				if (!sp.success) {
// 					console.error("Failed to parse super props:", sp, r);
// 					return reject("Failed to parse super props");
// 				}

// 				Storage.set("super_properties", [sp.output, Date.now()]);
// 				!didResolve && resolve(r);
// 			});
// 		});
// 	});
// }

// export async function getClientProps(): Promise<Output<typeof getPropsClient>> {
// 	return new Promise((resolve, reject) => {
// 		let didResolve = false;

// 		if (Storage.has("client_properties")) {
// 			const c = Storage.get("client_properties", [{}, 0] as [Output<typeof getProps>["client"], number]);
// 			if (parse(getPropsClient, c) && isValidTime(c[1])) (didResolve = true) && resolve(c[0]);
// 		}

// 		fetch(url).then((r) => {
// 			if (!r.ok) return !didResolve && reject("Invalid response");
// 			return r.json().then((r) => {
// 				r = parse(getProps, r).client;

// 				Storage.set("client_properties", [r, Date.now()]);
// 				!didResolve && resolve(r);
// 			});
// 		});
// 	});
// }
