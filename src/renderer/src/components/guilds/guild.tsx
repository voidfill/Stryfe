import { JSX, Show, createMemo } from "solid-js";

import GuildStore from "@stores/guilds";
import { HoverAnimationProvider, useAnimationContext } from "../common/animationcontext";
import { useSelectedGuildContext } from "../common/selectioncontextprovider";
import { NavLink } from "@solidjs/router";

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
	const guild = createMemo(() => GuildStore.getGuild(props.id));

	return (
		<Show when={!GuildStore.isUnavailable(props.id) && guild()} fallback={<div class="guild unavailable" />}>
			<HoverAnimationProvider
				classList={{
					available: true,
					guild: true,
					selected: useSelectedGuildContext()(props.id),
				}}
			>
				<Indicator id={props.id} />
				<NavLink href={`/channels/${props.id}`}>
					<ImageOrAcronym id={props.id} />
				</NavLink>
			</HoverAnimationProvider>
		</Show>
	);
}
