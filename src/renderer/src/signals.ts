import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import Storage from "@modules/storage";

export const [windowTitle, setWindowTitle] = createSignal("Stryfe");

export const [lastSelectedChannels, setLastSelectedChannels] = createStore<{
	[key: string]: string | undefined;
}>({ ...Storage.get("lastSelectedChannels", {}), "@me": undefined });

export const [showMembers, setShowMembers] = createSignal(Storage.get("showMembers", true));
export const [showUserProfile, setShowUserProfile] = createSignal(Storage.get("showUserProfile", true));
export const [showHelp, setShowHelp] = createSignal(Storage.get("showHelp", true));

export enum FriendsTabs {
	ONLINE,
	ALL,
	PENDING,
	BLOCKED,
	ADD,
}

export const [friendsTab, setFriendsTab] = createSignal<FriendsTabs>(FriendsTabs.ONLINE);
