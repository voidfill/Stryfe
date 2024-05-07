import { createMemo, JSX, Show } from "solid-js";

import MemberStore from "@stores/members";
import RoleStore from "@stores/roles";
import UserStore from "@stores/users";

export default function UserName(props: { color?: boolean; guildId?: string; id: string }): JSX.Element {
	const member = createMemo(() => (props.guildId ? MemberStore.getMember(props.guildId, props.id) : undefined));
	const user = createMemo(() => UserStore.getUser(props.id));
	const color = createMemo<string>(() => {
		if (!props.color || !member()) return "#fff";
		const highest = RoleStore.getHighestColoredForMember(props.guildId!, props.id);
		if (highest) {
			const role = RoleStore.getRole(highest);
			if (typeof role?.color === "number") return "#" + role.color.toString(16).padStart(6, "0");
		}
		return "#fff";
	});

	return (
		<span class="username" style={{ color: color() }}>
			<Show when={member() && member()?.nick} fallback={user()?.display_name || user()?.username}>
				{member()?.nick}
			</Show>
		</span>
	);
}
