import { For, JSX } from "solid-js";

import Guild from "./guild";

import GuildStore from "@stores/guilds";

import "./style.scss";
import { NavLink } from "@solidjs/router";
import { TiHome } from "solid-icons/ti";

import { lastSelectedChannels } from "../mainview";

export default function GuildsList(): JSX.Element {
	return (
		<div class="guilds-list scroller scroller-hidden">
			<NavLink class="home-button" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
				<TiHome size={48} fill="white" />
			</NavLink>
			<For each={GuildStore.guildIds}>{(id): JSX.Element => <Guild id={id} />}</For>
		</div>
	);
}
