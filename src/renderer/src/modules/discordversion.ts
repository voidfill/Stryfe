import { InferOutput, object, string } from "valibot";

const superProps = object({
	encoded: string(),
	properties: object({}),
});

export type clientProperties = InferOutput<typeof superProps>["properties"];

// TODO: Dolfies please i need your api :sob:

const hardcodedProps =
	"eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MTQ3Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MjEiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBkaXNjb3JkLzEuMC45MTQ3IENocm9tZS8xMjAuMC42MDk5LjI5MSBFbGVjdHJvbi8yOC4yLjEwIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIyOC4yLjEwIiwiY2xpZW50X2J1aWxkX251bWJlciI6MjkzNzQ3LCJuYXRpdmVfYnVpbGRfbnVtYmVyIjo0NzgzNCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwiZGVzaWduX2lkIjowfQ==";

export async function getSuper(): Promise<Output<typeof superProps>> {
	return new Promise((resolve) => {
		window.ipc.setUserAgent(JSON.parse(atob(hardcodedProps)).browser_user_agent).then(() => {
			resolve({
				encoded: hardcodedProps,
				properties: JSON.parse(atob(hardcodedProps)),
			});
		});
	});
}

const scriptRegex = /<script\W+nonce.+?>(.+?)<\/script>/gm;
const garbageRegex = /\|\|(\w+)\.contentWindow\.document;if\(\w+\){/gm;

export function cfChallenge(): Promise<undefined> {
	return new Promise((res, rej) => {
		fetch("https://discord.com/channels/")
			.then((r) => r.text())
			.then((h) => {
				const scripts = h.match(scriptRegex);
				if (!scripts) return rej("Failed to get scripts");
				let script = scripts.find((e) => e.includes("__CF$cv$params"));
				if (!script) {
					window.ipc.getCookies().then((c) => {
						if (!c.some((e) => e.name === "cf_clearance")) return rej("Failed to get cf_clearance");
						return res(undefined);
					});
				} else {
					script = scriptRegex.exec(script)![1];
					script = script.replace("/cdn-cgi/challenge-platform/", "https://discord.com/cdn-cgi/challenge-platform/");
					script = script.replace(
						garbageRegex,
						(m, p1) =>
							`${m}var ___xmlh = ${p1}.contentWindow.XMLHttpRequest.prototype; var ___oldOpen = ___xmlh.open;___xmlh.open = function(...args){args[1] = "http://discord.com" + args[1]; return ___oldOpen.apply(this, args)};`,
					);

					const el = document.createElement("script");
					el.innerHTML = script;
					document.head.append(el);
					res(undefined);
				}
			});
	});
}
