import { createEffect, createMemo, createSignal } from "solid-js";
import { boolean, fallback, optional, record, string } from "valibot";

import { persistSignal, persistStore } from "@modules/persist";

import { preloadedSettings } from "./stores/settings";

export const [windowTitle, setWindowTitle] = createSignal("Stryfe");

export const [lastSelectedChannels, setLastSelectedChannels] = persistStore(
	"lastSelectedChannels",
	fallback(record(string(), optional(string())), {}),
	(v) => {
		v["@me"] = undefined;
		return v;
	},
);

export const [showMembers, setShowMembers] = persistSignal("showMembers", fallback(boolean(), true));
export const [showDMUserProfile, setShowDMUserProfile] = persistSignal("showDMUserProfile", fallback(boolean(), true));
export const [showHelp, setShowHelp] = persistSignal("showHelp", fallback(boolean(), true));
export const [showAvatarsInCompact, setShowAvatarsInCompact] = persistSignal("showAvatarsInCompact", fallback(boolean(), true));

export const enum FriendsTabs {
	ONLINE,
	ALL,
	PENDING,
	BLOCKED,
	ADD,
}

export const [friendsTab, setFriendsTab] = createSignal<FriendsTabs>(FriendsTabs.ONLINE);

const prefersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
const [systemTheme, setSystemTheme] = createSignal<"light" | "dark">(prefersDarkTheme.matches ? "dark" : "light");
prefersDarkTheme.addEventListener("change", (e) => {
	setSystemTheme(e.matches ? "dark" : "light");
});
const [userSelectedTheme, setUserSelectedTheme] = createSignal<"light" | "dark" | "system">(
	(localStorage.getItem("computedTheme") as any) ?? "system",
);
export const theme = createMemo(() => {
	const theme = userSelectedTheme();
	if (theme === "system") return systemTheme();
	return theme;
});

createEffect(() => {
	const t = userSelectedTheme();
	window.ipc.setTheme(t);
	localStorage.setItem("computedTheme", userSelectedTheme());
});
createEffect(() => {
	const theme = preloadedSettings.appearance?.theme;
	if (theme === undefined) return;

	setUserSelectedTheme((["system", "dark", "light"] as const)[theme]);
});
