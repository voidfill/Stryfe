import { createStore } from "solid-js/store";
import Store from ".";

import { ActivityTypes, activity } from "@renderer/constants/gatewaytypes";

const [activities, setActivities] = createStore<{
	[userId: string]: activity[] | undefined;
}>({});

export default new (class ActivityStore extends Store {
	constructor() {
		super({
			PRESENCE_UPDATE: ({ user, activities }) => {
				setActivities(user.id, activities);
			},
			READY_SUPPLEMENTAL: ({ merged_presences: { friends, guilds } }) => {
				for (const friend of friends) {
					setActivities(friend.user_id, friend.activities || undefined);
				}
				for (const guild of guilds) {
					for (const presence of guild || []) {
						setActivities(presence.user_id, presence.activities || undefined);
					}
				}
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
})();
