import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import Store from ".";

import { activity, ActivityTypes } from "@renderer/constants/gatewaytypes";

const [activities, setActivities] = createStore<{
	[userId: string]: activity[] | undefined;
}>({});

let selfId = "selfId";
export default new (class ActivityStore extends Store {
	constructor() {
		super({
			PRESENCE_UPDATE: ({ user, activities }) => {
				setActivities(user.id, reconcile(activities));
			},
			READY: ({ user, sessions }) => {
				selfId = user.id;

				if (!sessions.length) return;
				setActivities(user.id, reconcile(sessions[0].activities || undefined));
			},
			READY_SUPPLEMENTAL: ({ merged_presences: { friends, guilds } }) => {
				batch(() => {
					for (const friend of friends) {
						setActivities(friend.user_id, reconcile(friend.activities || undefined));
					}
					for (const guild of guilds) {
						for (const presence of guild || []) {
							setActivities(presence.user_id, reconcile(presence.activities || undefined));
						}
					}
				});
			},
			SESSIONS_REPLACE: (sessions) => {
				if (!sessions.length) return;
				// sessions[0] is either all sessions combined or the current one
				setActivities(selfId, reconcile(sessions[0].activities || undefined));
			},
		});
	}

	// eslint-disable-next-line solid/reactivity
	getActivities(userId: string): activity[] | undefined {
		return activities[userId];
	}

	// eslint-disable-next-line solid/reactivity
	isStreaming(userId: string): boolean {
		const userActivities = activities[userId];
		if (!userActivities) return false;

		for (const activity of userActivities) {
			if (activity.type === ActivityTypes.STREAMING) return true;
		}
		return false;
	}

	// eslint-disable-next-line solid/reactivity
	getCustomStatus(userId: string):
		| undefined
		| {
				emoji?: { animated?: boolean; id?: string; name: string };
				text?: string;
		  } {
		const userActivities = activities[userId];
		if (!userActivities) return undefined;

		for (const activity of userActivities) {
			if (activity.type === ActivityTypes.CUSTOM)
				return {
					emoji: activity.emoji || undefined,
					text: activity.state || undefined,
				};
		}
		return undefined;
	}
})();
