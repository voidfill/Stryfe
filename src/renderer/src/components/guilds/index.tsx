import { For, JSX } from "solid-js";

import Guild from "./guild";

import GuildStore from "@stores/guilds";

import "./style.scss";

export default function GuildsList(): JSX.Element {
	return (
		<div class="guilds-list scroller scroller-hidden">
			<div class="home-button">Home button nya</div>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
