import { NavLink } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import GuildStore from "@stores/guilds";

import { HoverAnimationDirective, useAnimationContext } from "../common/animationcontext";
import { useSelectedGuildContext } from "../common/selectioncontext";
import TooltipDirective, { TooltipColors, TooltipPosition } from "../common/tooltip";
import { lastSelectedChannels } from "../mainview";

HoverAnimationDirective;
TooltipDirective;

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
	const selg = useSelectedGuildContext();

	return (
		<Show when={!GuildStore.isUnavailable(props.id) && guild()} fallback={<div class={`guild guild-${props.id} unavailable`} />}>
			<div
				classList={{
					available: true,
					guild: true,
					[`guild-${props.id}`]: true,
					selected: selg(props.id),
				}}
			>
				<Indicator id={props.id} />
				<NavLink href={`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`}>
					<div
						class="guild-icon-container"
						use:HoverAnimationDirective
						use:TooltipDirective={{
							color: TooltipColors.BLACK,
							content: <div>{guild()?.name}</div>,
							position: TooltipPosition.RIGHT,
						}}
					>
						<ImageOrAcronym id={props.id} />
					</div>
				</NavLink>
			</div>
		</Show>
	);
}
