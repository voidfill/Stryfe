import { For, JSX } from "solid-js";

import Guild from "./guild";

import GuildStore from "@stores/guilds";

import "./style.scss";
import { NavLink } from "@solidjs/router";

export default function GuildsList(): JSX.Element {
	return (
		<div class="guilds-list scroller scroller-hidden">
			<NavLink class="home-button" href="/channels/@me">
				Home
			</NavLink>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
