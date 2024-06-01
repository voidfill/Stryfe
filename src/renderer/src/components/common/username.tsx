import { createMemo, JSX, Show } from "solid-js";

import { roleIconURL } from "@constants/images";

import MemberStore from "@stores/members";
import RoleStore from "@stores/roles";
import UserStore from "@stores/users";

import tippy from "./tooltip";

import "./username.scss";

tippy;

export default function UserName(props: { color?: boolean; guildId?: string; id: string; roleIcon?: boolean }): JSX.Element {
	const user = createMemo(() => UserStore.getUser(props.id));
	const color = createMemo<string>(() => {
		if (!props.color || !props.guildId || !MemberStore.hasMember(props.guildId, props.id) || !user()) return "#fff";
		const highest = RoleStore.getHighestColoredForMember(props.guildId!, props.id);
		if (highest) {
			const role = RoleStore.getRole(highest);
			if (typeof role?.color === "number") return "#" + role.color.toString(16).padStart(6, "0");
		}
		return "#fff";
	});
	const name = createMemo<string | undefined>(() =>
		props.guildId ? MemberStore.getName(props.guildId, props.id) : user()?.username || user()?.display_name || undefined,
	);
	const iconRoleId = createMemo<string | undefined>(() =>
		props.roleIcon && props.guildId ? RoleStore.getHighestIconForMember(props.guildId, props.id) : undefined,
	);
	const iconRole = createMemo(() => {
		const i = iconRoleId();
		if (!i) return undefined;
		return RoleStore.getRole(i);
	});

	return (
		<span class="username" style={{ color: color() }}>
			<Show when={name()} fallback={"unknown"} keyed>
				{(n) => <span class="username-name">{n}</span>}
			</Show>
			<Show when={props.roleIcon && iconRole()}>
				{(r) => (
					<span class="role-icon-container" use:tippy={{ content: () => r().name }}>
						<Show when={r().icon} fallback={r().unicode_emoji}>
							{(i) => <img class="role-icon" src={roleIconURL(iconRoleId()!, i(), 20)} alt={r.name} />}
						</Show>
					</span>
				)}
			</Show>
		</span>
	);
}
