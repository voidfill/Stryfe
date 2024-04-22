import { A } from "@solidjs/router";
import { createMemo, For, JSX, Show } from "solid-js";

import GuildStore from "@stores/guilds";
import SettingsStore from "@stores/settings";

import { TiHome } from "solid-icons/ti";

import Folder from "./folder";
import Guild from "./guild";

import "./style.scss";

import { lastSelectedChannels } from "@renderer/signals";

export default function GuildsList(): JSX.Element {
	const folders = createMemo(() => SettingsStore.preloadedSettings.guildFolders?.folders);
	const guildIds = createMemo(() => GuildStore.getGuildIds());
	const notSortedAsSorted = createMemo<string[]>(
		() => {
			const all = new Set(guildIds());
			if (folders()?.length) {
				for (const folder of folders()!) {
					for (const id of folder.guildIds) {
						all.delete(String(id));
					}
				}
			}

			return [...all]
				.map((id) => [id, new Date(GuildStore.getGuild(id)?.joined_at ?? 0).valueOf()] as [string, number])
				.sort((a, b) => b[1] - a[1])
				.map((a) => a[0]);
		},
		[],
		{
			equals: (prev, next) => {
				if (prev.length !== next.length) return false;
				for (let i = 0; i < prev.length; i++) {
					if (prev[i] !== next[i]) return false;
				}
				return true;
			},
		},
	);

	return (
		<div class="guilds-list scroller scroller-hidden">
			<A class="home-button" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
				<TiHome size={48} fill="white" />
			</A>
			<For each={notSortedAsSorted()}>{(id): JSX.Element => <Guild id={id} />}</For>
			<For each={folders()}>
				{(f): JSX.Element => (
					<Show when={f.id} fallback={<Guild id={String(f.guildIds[0])} />}>
						<Folder guildIds={f.guildIds} id={f.id} name={f.name} color={f.color} />
					</Show>
				)}
			</For>
		</div>
	);
}
