import { For, JSX } from "solid-js";

import Guild from "./guild";

import { PreloadedUserSettings_GuildFolder } from "discord-protos";

export default function Folder(props: PreloadedUserSettings_GuildFolder): JSX.Element {
	return (
		<div classList={{ folder: true }}>
			<div class="folder-header" style={{ "background-color": "#" + (props.color?.value?.toString(16) || "fff") }}>
				{"// TODO: color defaults"}
			</div>
			<div class="folder-list">
				<For each={props.guildIds}>{(id): JSX.Element => <Guild id={String(id)} />}</For>
			</div>
		</div>
	);
}
