import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { InferOutput } from "valibot";

import { activity as _activity } from "@constants/schemata/presence";
import { ActivityTypes } from "@constants/user";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";

type _activity = InferOutput<typeof _activity>;

const [activities, setActivities] = createStore<{
	[userId: string]: _activity[] | undefined;
}>({});

let selfId = "selfId";

on("GUILD_MEMBERS_CHUNK", ({ presences }) => {
	if (!presences || !presences.length) return;

	batch(() => {
		for (const presence of presences) setActivities(presence.user.id, reconcile(presence.activities || undefined));
	});
});

on("PRESENCE_UPDATE", ({ user, activities }) => {
	setActivities(user.id, reconcile(activities || undefined));
});

on("READY", ({ user, sessions }) => {
	selfId = user.id;

	if (!sessions.length) return;
	setActivities(selfId, reconcile(sessions[0].activities || undefined));
});

on("READY_SUPPLEMENTAL", ({ merged_presences }) => {
	if (!merged_presences) return;
	batch(() => {
		for (const friend of merged_presences.friends ?? []) setActivities(friend.user_id, reconcile(friend.activities || undefined));

		for (const guild of merged_presences.guilds ?? [])
			for (const presence of guild ?? []) setActivities(presence.user_id, reconcile(presence.activities || undefined));
	});
});

on("SESSIONS_REPLACE", (sessions) => {
	if (!sessions.length) return;
	setActivities(selfId, reconcile(sessions[0].activities || undefined));
});

export const getActivities = p((userId: string) => activities[userId]);

export const isStreaming = p((userId: string) => {
	const userActivities = getActivities(userId);
	if (!userActivities) return false;

	return userActivities.some((activity) => activity.type === ActivityTypes.STREAMING);
});

export const getCustomStatus = p((userId: string) => {
	const userActivities = getActivities(userId);
	if (!userActivities) return undefined;

	const found = userActivities.find((a) => a.type === ActivityTypes.CUSTOM);
	if (!found) return undefined;

	return {
		emoji: found.emoji || undefined,
		text: found.state || undefined,
	};
});

registerDebugStore("activities", {
	getActivities,
	getCustomStatus,
	isStreaming,
	state: { activities },
});
