import { Navigate, useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createSelector, JSX, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import Storage from "@modules/storage";

import ChannelStore from "@stores/channels";
import ConnectionStore from "@stores/connection";
import GuildStore from "@stores/guilds";

import GuildsList from "@components/guilds";

import Chat from "../chat";
import { SelectedChannelContext, SelectedGuildContext } from "../common/selectioncontext";
import MemberList from "../memberlist";
import SideBar from "../sidebar";
import FriendsView from "./friendsview";
import HeaderBar, { showMembers, showUserProfile } from "./headerbar";

import "./style.scss";

import shiggy from "@resources/shiggy.gif";

import { ChannelTypes } from "@renderer/constants/channel";
import { setWindowTitle } from "@renderer/main";

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
			if (lastSelectedChannels[params.guildId]) navigate(`/channels/${params.guildId}/${lastSelectedChannels[params.guildId]}`);
			else {
				const sortedChannels = ChannelStore.getSortedGuildChannels(params.guildId);
				const channelId = sortedChannels?.uncategorized.other[0] || sortedChannels?.categorized[0]?.other[0];
				if (channelId) navigate(`/channels/${params.guildId}/${channelId}`);
			}
		}

		untrack(() => {
			Storage.set("lastSelectedChannels", lastSelectedChannels);
		});
	});

	createEffect(() => {
		const ch = currChannel();
		if (params.guildId === "@me") {
			if (ch)
				setWindowTitle(
					`${(currChannel().type === ChannelTypes.DM ? "@" : "") + ChannelStore.getPrivateChannelName(params.channelId)} - Stryfe`,
				);
			else setWindowTitle("Friends - Stryfe");
			return;
		}
		if (ch)
			setWindowTitle(`#${"name" in ch ? ch.name : params.channelId} | ${GuildStore.getGuild(params.guildId)?.name ?? params.guildId} - Stryfe`);
		else setWindowTitle("Stryfe");
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
									<Show when={showUserProfile() && currChannel()?.type === ChannelTypes.DM}>
										<span>DM User Profile</span>
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
