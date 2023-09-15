import { Navigate, useNavigate, useParams } from "@solidjs/router";
import { JSX, Show, createEffect, createMemo, createSelector, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import Storage from "@modules/storage";

import ConnectionStore from "@stores/connection";
import ChannelStore from "@stores/channels";

import { SelectedChannelContext, SelectedGuildContext } from "../common/selectioncontext";
import GuildsList from "@components/guilds";
import SideBar from "../sidebar";
import HeaderBar, { showMembers } from "./headerbar";
import FriendsView from "../FriendsView";
import Chat from "../chat";
import MemberList from "../memberlist";

import "./style.scss";
import shiggy from "@resources/shiggy.gif";
import { ChannelTypes } from "@renderer/constants/channel";

const [lastSelectedChannels, setLastSelectedChannels] = createStore<{
	[key: string]: string | undefined;
}>({ ...Storage.get("lastSelectedChannels", {}), "@me": undefined });
export { lastSelectedChannels };

export default function MainView(): JSX.Element {
	// we do not want to run all the setup if its just gonna navigate away.
	// eslint-disable-next-line solid/components-return-once
	if (!Storage.has("token")) return <Navigate href="/login" />;

	const params = useParams(),
		navigate = useNavigate(),
		selectedChannel = createSelector(() => params.channelId),
		selectedGuild = createSelector(() => params.guildId),
		currChannel = createMemo(() =>
			params.guildId === "@me" ? ChannelStore.getDirectMessage(params.channelId) : ChannelStore.getGuildChannel(params.channelId),
		);

	createEffect(() => {
		setLastSelectedChannels(params.guildId, params.channelId);

		if (!currChannel()) {
			if (lastSelectedChannels[params.guildId]) {
				navigate(`/channels/${params.guildId}/${lastSelectedChannels[params.guildId]}`);
			} else {
				const sortedChannels = ChannelStore.getSortedGuildChannels(params.guildId);
				const channelId = sortedChannels?.uncategorized.other[0] || sortedChannels?.categorized[0]?.other[0];
				if (channelId) {
					navigate(`/channels/${params.guildId}/${channelId}`);
				}
			}
		}

		untrack(() => {
			Storage.set("lastSelectedChannels", lastSelectedChannels);
		});
	});

	return (
		<Show
			when={ConnectionStore.connected()}
			fallback={
				<div class="not-connected">
					<img class="shiggy" src={shiggy} alt="shiggy" />
					<div class="not-connected-text">
						{ConnectionStore.outOfRetries() ? "Couldnt establish a connection to Discord servers." : "Connecting..."}
					</div>
					<Show when={ConnectionStore.outOfRetries()}>
						<button onClick={(): void => {} /* add socket retry */}>Retry</button>
					</Show>
				</div>
			}
		>
			<SelectedChannelContext.Provider value={selectedChannel}>
				<SelectedGuildContext.Provider value={selectedGuild}>
					<div class="main-view">
						<GuildsList />
						<SideBar />
						<div class="channel-wrapper">
							<HeaderBar />
							<div class="channel">
								<Show
									when={currChannel()}
									fallback={
										<Show
											when={params.guildId === "@me" && !params.channelId}
											fallback={<div class="nochannel">no channel selected</div>}
										>
											<FriendsView />
										</Show>
									}
								>
									<Chat />
									<Show when={showMembers() && params.channelId && currChannel()?.type !== ChannelTypes.DM}>
										<MemberList />
									</Show>
								</Show>
							</div>
						</div>
					</div>
				</SelectedGuildContext.Provider>
			</SelectedChannelContext.Provider>
		</Show>
	);
}
