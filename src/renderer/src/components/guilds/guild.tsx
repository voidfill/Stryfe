import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import { arbitrary } from "../common/usearbitrary";

import { lastSelectedChannels } from "@renderer/signals";
import { getAcronym, getGuild, getIconUrl } from "@renderer/stores/guilds";
import { createDraggable } from "@thisbeyond/solid-dnd";

arbitrary;

export function GuildIcon(props: { id: string }): JSX.Element {
	const guild = createMemo(() => getGuild(props.id));

	return (
		<Show when={guild()}>
			{(guild) => (
				<Show when={guild().icon} fallback={<div class="icon guild-acronym">{getAcronym(props.id)}</div>}>
					<img class="icon" src={getIconUrl(props.id, 48)} draggable={false} />
				</Show>
			)}
		</Show>
	);
}

export function GuildWrapper(props: { id: string; parentId?: string }): JSX.Element {
	const nav = useNavigate();
	const params = useParams();

	const guild = createMemo(() => getGuild(props.id));
	const isSelected = createMemo(() => params.guildId === props.id);
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { id: props.id, parentId: props.parentId, type: "guild" });

	return (
		<Show when={guild()}>
			{(guild) => (
				<div classList={{ "active-draggable": draggable?.isActiveDraggable, guild: true, selected: isSelected() }}>
					<div class="indicator" />
					<div
						classList={{ acronym: !guild().icon, "icon-container": true }}
						onClick={() => nav(`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`)}
						use:arbitrary={[draggable]}
					>
						<Show when={!draggable.isActiveDraggable}>
							<GuildIcon id={props.id} />
						</Show>
					</div>
				</div>
			)}
		</Show>
	);
}
