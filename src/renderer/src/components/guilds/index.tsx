import { A } from "@solidjs/router";
import { For, JSX } from "solid-js";

import GuildStore from "@stores/guilds";

import { TiHome } from "solid-icons/ti";

import Guild from "./guild";

import "./style.scss";

import { lastSelectedChannels } from "@renderer/signals";

export default function GuildsList(): JSX.Element {
	return (
		<div id="guilds-list" class="scroller scroller-hidden">
				<A id="home-button" class="guild" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
					<TiHome class="home-icon" size={30} fill="white" />
				</A>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
