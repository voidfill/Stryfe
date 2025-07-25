import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import { InferOutput } from "valibot";

import { client_status as _client_status } from "@constants/schemata/presence";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";

type client_status = InferOutput<typeof _client_status>;

export const enum Status {
	OFFLINE,
	ONLINE,
	IDLE,
	DND,
}

// [mobile, desktop, web]
type Statuses = [Status, Status, Status];

const sm = new Map<string, Status>([
	["invisible", Status.OFFLINE],
	["offline", Status.OFFLINE],
	["online", Status.ONLINE],
	["idle", Status.IDLE],
	["dnd", Status.DND],
]);

function convertStatus(status: client_status): Statuses {
	return [
		(status.mobile && sm.get(status.mobile)) || Status.OFFLINE,
		(status.desktop && sm.get(status.desktop)) || Status.OFFLINE,
		(status.web && sm.get(status.web)) || Status.OFFLINE,
	];
}

export function statusToText(status: Status): string {
	switch (status) {
		case Status.OFFLINE:
			return "Offline";
		case Status.ONLINE:
			return "Online";
		case Status.IDLE:
			return "Idle";
		case Status.DND:
			return "Do Not Disturb";
	}
}

const [statuses, setStatuses] = createStore<{
	[key: string]: Statuses;
}>({});

on("GUILD_MEMBERS_CHUNK", ({ presences }) => {
	if (!presences || !presences.length) return;

	batch(() => {
		for (const presence of presences) {
			setStatuses(presence.user.id, convertStatus(presence.client_status));
		}
	});
});

on("PRESENCE_UPDATE", ({ user, client_status }) => {
	setStatuses(user.id, convertStatus(client_status));
});

on("READY", ({ session_id, sessions, user }) => {
	const session = sessions.find((s) => s.session_id === session_id);
	if (!session) return;
	setStatuses(user.id, [0, sm.get(session.status) || Status.OFFLINE, 0]);
});

on("READY_SUPPLEMENTAL", ({ merged_presences }) => {
	batch(() => {
		for (const friend of merged_presences?.friends ?? []) {
			setStatuses(friend.user_id, convertStatus(friend.client_status));
		}
		for (const guild of merged_presences?.guilds ?? []) {
			for (const member of guild || []) {
				setStatuses(member.user_id, convertStatus(member.client_status));
			}
		}
	});
});

export const getStatus = p((id: string): Status => {
	const status = statuses[id];
	if (!status) return Status.OFFLINE;

	return status[0] || status[1] || status[2] || Status.OFFLINE;
});

export const getSignificantPlatform = p((id: string): "desktop" | "web" | "mobile" | null => {
	const status = statuses[id];
	if (!status) return null;

	return status[0] ? "mobile" : status[2] ? "web" : status[1] ? "desktop" : null;
});

export const getFullStatus = p((id: string): Statuses | undefined => statuses[id]);

registerDebugStore("status", {
	getFullStatus,
	getSignificantPlatform,
	getStatus,
	state: {
		statuses,
	},
});
