import { createSignal } from "solid-js";
import { boolean, fallback, optional, record, string } from "valibot";

import Persistent from "@stores/persistent";

export const [windowTitle, setWindowTitle] = createSignal("Stryfe");

export const [lastSelectedChannels, setLastSelectedChannels] = Persistent.registerStore(
	"lastSelectedChannels",
	fallback(record(string(), optional(string())), {}),
	(v) => {
		v["@me"] = undefined;
		return v;
	},
);

export const [showMembers, setShowMembers] = Persistent.registerSignal("showMembers", fallback(boolean(), true));
export const [showDMUserProfile, setShowDMUserProfile] = Persistent.registerSignal("showDMUserProfile", fallback(boolean(), true));
export const [showHelp, setShowHelp] = Persistent.registerSignal("showHelp", fallback(boolean(), true));
export const [showAvatarsInCompact, setShowAvatarsInCompact] = Persistent.registerSignal("showAvatarsInCompact", fallback(boolean(), true));

export enum FriendsTabs {
	ONLINE,
	ALL,
	PENDING,
	BLOCKED,
	ADD,
}

export const [friendsTab, setFriendsTab] = createSignal<FriendsTabs>(FriendsTabs.ONLINE);
