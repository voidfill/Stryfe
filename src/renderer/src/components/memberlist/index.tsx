import { createMemo, For, JSX } from "solid-js";

import { getMembers, getName } from "@stores/members";

import Avatar from "../common/avatar";
import { useLocationContext } from "../common/locationcontext";

export default function MemberList(): JSX.Element {
	const location = useLocationContext();
	const members = createMemo(() => getMembers(location().guildId));

	return (
		<div class="member-list">
			<For each={members() ?? []}>
				{(id): JSX.Element => {
					const name = createMemo(() => getName(location().guildId, id));
					return (
						<div>
							<Avatar size={32} guildId={location().guildId} userId={id} />
							{name()}
						</div>
					);
				}}
			</For>
		</div>
	);
}
