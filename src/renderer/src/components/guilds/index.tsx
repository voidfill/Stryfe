import { For, JSX } from "solid-js";

import GuildStore from "@stores/guilds";

import { TiHome } from "solid-icons/ti";

import Guild from "./guild";

import "./style.scss";

import { lastSelectedChannels } from "@renderer/signals";

export default function GuildsList(): JSX.Element {
	return (
		<div class="guilds-list scroller scroller-hidden">
			<a class="home-button" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
				<TiHome size={48} fill="white" />
			</a>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
