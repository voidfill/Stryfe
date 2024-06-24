import { createMemo, JSX, Show } from "solid-js";

import { roleIconURL } from "@constants/images";

import { getName, hasMember } from "@stores/members";
import { getHighestColoredForMember, getHighestIconForMember, getRole } from "@stores/roles";
import { getUser } from "@stores/users";

import ClanBadge from "./clanbadge";
import tippy from "./tooltip";

import "./username.scss";

tippy;

export default function UserName(props: {
	clan?: boolean;
	color?: boolean;
	guildId?: string;
	id: string;
	noInteract?: boolean;
	roleIcon?: boolean;
}): JSX.Element {
	const user = createMemo(() => getUser(props.id));
	const color = createMemo<string>(() => {
		if (!props.color || !props.guildId || !hasMember(props.guildId, props.id) || !user()) return "#fff";
		const highest = getHighestColoredForMember(props.guildId!, props.id);
		if (highest) {
			const role = getRole(highest);
			if (typeof role?.color === "number") return "#" + role.color.toString(16).padStart(6, "0");
		}
		return "#fff";
	});
	const name = createMemo<string | undefined>(() =>
		props.guildId ? getName(props.guildId, props.id) : user()?.username || user()?.display_name || undefined,
	);
	const iconRoleId = createMemo<string | undefined>(() =>
		props.roleIcon && props.guildId ? getHighestIconForMember(props.guildId, props.id) : undefined,
	);
	const iconRole = createMemo(() => {
		const i = iconRoleId();
		if (!i) return undefined;
		return getRole(i);
	});

	return (
		<span classList={{ "no-interact": props.noInteract, username: true }}>
			<span style={{ color: color() }} class="username-name">
				<Show when={name()} fallback={"unknown"} keyed>
					{(n) => n}
				</Show>
			</span>
			<Show when={props.roleIcon && iconRole()}>
				{(r) => (
					<span class="role-icon-container" use:tippy={{ content: () => r().name }}>
						<Show when={r().icon} fallback={r().unicode_emoji}>
							{(i) => <img class="role-icon" src={roleIconURL(iconRoleId()!, i(), 20)} alt={r.name} />}
						</Show>
					</span>
				)}
			</Show>
			<Show when={props.clan}>
				<ClanBadge userId={props.id} clickable={!props.noInteract} />
			</Show>
		</span>
	);
}
