import { JSX, Show } from "solid-js";

import PrivateChannels from "./privatechannels";
import { useParams } from "@solidjs/router";
import GuildChannels from "./guildchannels";

import "./style.scss";

export default function SideBar(): JSX.Element {
	const params = useParams();

	return (
		<div class="sidebar">
			<Show when={params.guildId === "@me"} fallback={<GuildChannels />}>
				<PrivateChannels />
			</Show>
			<div class="user-area">User Area</div>
		</div>
	);
}
