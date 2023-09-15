import { client_status } from "@renderer/constants/gatewaytypes";
import Store from ".";
import { createStore } from "solid-js/store";

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

const [statuses, setStatuses] = createStore<{
	[key: string]: Statuses;
}>({});

// TODO: Ready, sessions replace, basically self.
export default new (class StatusStore extends Store {
	constructor() {
		super({
			PRESENCE_UPDATE: ({ user, client_status }) => {
				setStatuses(user.id, convertStatus(client_status));
			},
			READY_SUPPLEMENTAL: ({ merged_presences: { friends, guilds } }) => {
				for (const friend of friends) {
					setStatuses(friend.user_id, convertStatus(friend.client_status));
				}
				for (const guild of guilds) {
					for (const member of guild || []) {
						setStatuses(member.user_id, convertStatus(member.client_status));
					}
				}
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getStatus(id: string): Status {
		const status = statuses[id];
		if (!status) return Status.OFFLINE;

		return status[0] || status[1] || status[2] || Status.OFFLINE;
	}

	// eslint-disable-next-line solid/reactivity
	getSignificantPlatform(id: string): "desktop" | "web" | "mobile" | null {
		const status = statuses[id];
		if (!status) return null;

		return status[0] ? "mobile" : status[2] ? "web" : status[1] ? "desktop" : null;
	}
})();
