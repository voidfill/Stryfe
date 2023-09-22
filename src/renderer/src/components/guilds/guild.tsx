import { NavLink, useParams } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import GuildStore from "@stores/guilds";

import { HoverAnimationProvider, useAnimationContext } from "../common/animationcontext";
import { useSelectedGuildContext } from "../common/selectioncontext";
import { lastSelectedChannels } from "../mainview";

function ImageOrAcronym(props: { id: string }): JSX.Element {
	const doAnimate = useAnimationContext();

	const icon = createMemo(() => GuildStore.getIconUrl(props.id, 96, doAnimate()));

	return (
		<Show when={icon()} fallback={<div class="guild-icon acronym">{GuildStore.getAcronym(props.id)}</div>}>
			<img class="guild-icon icon" src={icon()} />
		</Show>
	);
}

function Indicator(props: { id: string }): JSX.Element {
	return (
		<div class="indicator">
			<span class="pill" />
		</div>
	);
}

export default function Guild(props: { id: string }): JSX.Element {
	const params = useParams();
	const guild = createMemo(() => GuildStore.getGuild(props.id));
	const selg = useSelectedGuildContext();

	return (
		<Show when={!GuildStore.isUnavailable(props.id) && guild()} fallback={<div class="guild unavailable" />}>
			<HoverAnimationProvider
				classList={{
					available: true,
					guild: true,
					selected: selg(props.id),
				}}
			>
				<Indicator id={props.id} />
				<NavLink href={`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`}>
					<ImageOrAcronym id={props.id} />
				</NavLink>
			</HoverAnimationProvider>
		</Show>
	);
}
