import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { RelationshipTypes } from "@constants/user";

import Store from ".";

type Relationship = {
	id: string;
	nickname?: string | null;
	since: Date | null;
	type: RelationshipTypes;
};

const [relationships, setRelationships] = createStore<{
	[id: string]: Relationship;
}>({});
const [friends, setFriends] = createStore<string[]>([]);
const [blocked, setBlocked] = createStore<string[]>([]);
const [pending, setPending] = createStore<string[]>([]);
function add(id: string, r: Relationship): void {
	setRelationships(id, r);
	switch (r.type) {
		case RelationshipTypes.FRIEND:
			setFriends((f) => [...f, id]);
			break;
		case RelationshipTypes.BLOCKED:
			setBlocked((b) => [...b, id]);
			break;
		case RelationshipTypes.PENDING_INCOMING:
		case RelationshipTypes.PENDING_OUTGOING:
			setPending((p) => [...p, id]);
			break;
	}
}
function remove(id: string): void {
	const r = relationships[id];
	if (!r) return;
	setRelationships(produce((relationships) => delete relationships[id]));
	switch (r.type) {
		case RelationshipTypes.FRIEND:
			setFriends((f) => f.filter((i) => i != id));
			break;
		case RelationshipTypes.BLOCKED:
			setBlocked((b) => b.filter((i) => i != id));
			break;
		case RelationshipTypes.PENDING_INCOMING:
		case RelationshipTypes.PENDING_OUTGOING:
			setPending((p) => p.filter((i) => i != id));
			break;
	}
}

export default new (class RelationshipStore extends Store {
	constructor() {
		super({
			READY: ({ relationships: r }) => {
				if (!r) return;
				batch(() => {
					for (const relationship of r) {
						setRelationships(relationship.id, {
							id: relationship.id,
							nickname: relationship.nickname || null,
							since: relationship.since ? new Date(relationship.since) : null,
							type: relationship.type,
						});
					}

					setFriends(r.filter((r) => r.type == RelationshipTypes.FRIEND).map((r) => r.id));
					setBlocked(r.filter((r) => r.type == RelationshipTypes.BLOCKED).map((r) => r.id));
					setPending(
						r
							.filter((r) => r.type == RelationshipTypes.PENDING_INCOMING || r.type == RelationshipTypes.PENDING_OUTGOING)
							.map((r) => r.id),
					);
				});
			},
			RELATIONSHIP_ADD: (relationship) => {
				add(relationship.id, {
					id: relationship.id,
					nickname: relationship.nickname || null,
					since: relationship.since ? new Date(relationship.since) : null,
					type: relationship.type,
				});
			},
			RELATIONSHIP_REMOVE: ({ id }) => {
				remove(id);
			},
		});
	}

	getRelationships(): string[];
	getRelationships(validator: (r: Relationship) => boolean): string[];
	// eslint-disable-next-line solid/reactivity
	getRelationships(validator?: (r: Relationship) => boolean): string[] {
		if (validator) {
			return Object.keys(relationships).filter((id) => validator(relationships[id]));
		}
		return Object.keys(relationships);
	}

	// eslint-disable-next-line solid/reactivity
	getRelationship(id: string): Relationship | undefined {
		return relationships[id];
	}

	// eslint-disable-next-line solid/reactivity
	getRelationshipsByType(type: RelationshipTypes): string[] {
		return Object.keys(relationships).filter((id) => relationships[id].type == type);
	}

	getFriends(): string[] {
		return friends;
	}

	getBlocked(): string[] {
		return blocked;
	}

	getPending(): string[] {
		return pending;
	}
})();
