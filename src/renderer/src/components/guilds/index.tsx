import { A } from "@solidjs/router";
import { For, JSX } from "solid-js";

import GuildStore from "@stores/guilds";

import { TiHome } from "solid-icons/ti";

import Guild from "./guild";

import "./style.scss";

import { lastSelectedChannels } from "@renderer/signals";

export default function GuildsList(): JSX.Element {
	return (
		<div class="guilds-list scroller scroller-hidden">
			<A class="home-button" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
				<TiHome size={48} fill="white" />
			</A>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
