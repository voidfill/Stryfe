import { useParams } from "@solidjs/router";
import { createMemo, For, JSX, Show } from "solid-js";

import MemberStore from "@stores/members";

import Avatar from "../common/avatar";

export default function MemberList(): JSX.Element {
	const params = useParams();
	const members = createMemo(() => MemberStore.getMembers(params.guildId));

	return (
		<div class="member-list">
			<Show when={members()} keyed>
				{(m): JSX.Element => (
					<For each={m}>
						{(id): JSX.Element => {
							const name = createMemo(() => MemberStore.getMember(params.guildId, id)?.nick);
							return (
								<div class={`member member-${id}`}> 
									<Avatar size={32} guildId={params.guildId} userId={id} />
									{id} {name()}
								</div>
							);
						}}
					</For>
				)}
			</Show>
		</div>
	);
}
