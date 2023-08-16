import { JSX, For, Show } from "solid-js";

import PrivateChannels from "./privatechannels";
import { useParams } from "@solidjs/router";
import ServerChannels from "./serverchannels";

export default function SideBar(): JSX.Element {
	const params = useParams();

	return (
		<div class="sidebar">
			<Show when={params.guildId === "@me"} fallback={<ServerChannels />}>
				<PrivateChannels />
			</Show>
			<div class="user-area">User Area</div>
		</div>
	);
}
