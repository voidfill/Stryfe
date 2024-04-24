import { createEffect, createMemo, For, JSX, Show } from "solid-js";
import { createStore } from "solid-js/store";

import GuildStore from "@stores/guilds";

import { AiOutlineFolder } from "solid-icons/ai";

import Guild from "./guild";

import Storage from "@renderer/modules/storage";
import { PreloadedUserSettings_GuildFolder } from "discord-protos";

const [collapsed, setCollapsed] = createStore(Storage.get<{ [key: string]: boolean }>("guildFoldersCollapsed", {}));
createEffect(() => {
	Storage.set("guildFoldersCollapsed", collapsed);
});

function MiniIcon(props: { id: string }): JSX.Element {
	const url = createMemo(() => GuildStore.getIconUrl(props.id, 32, false));
	const acronym = createMemo(() => GuildStore.getAcronym(props.id));

	return (
		<Show when={url()} fallback={acronym()}>
			{<img src={url()} />}
		</Show>
	);
}

export default function Folder(props: PreloadedUserSettings_GuildFolder): JSX.Element {
	const id = createMemo(() => String(props.id?.value));
	const isCollapsed = createMemo(() => collapsed[id()] ?? false);
	function toggleCollapse(): void {
		setCollapsed(id(), (prev) => !prev);
	}

	return (
		<div classList={{ collapsed: isCollapsed(), folder: true }} style={{ "--folder-color": "#" + (props.color?.value?.toString(16) ?? "fff") }}>
			<div class="folder-header" onClick={toggleCollapse}>
				<div class="header-container">
					<div class="folder-icon">
						<AiOutlineFolder size={48} />
					</div>
					<div class="folder-items">
						<For each={props.guildIds.slice(0, 4)}>{(gid): JSX.Element => MiniIcon({ id: String(gid) })}</For>
					</div>
				</div>
			</div>
			<div class="folder-list">
				<For each={props.guildIds}>{(id): JSX.Element => <Guild id={String(id)} />}</For>
			</div>
		</div>
	);
}
