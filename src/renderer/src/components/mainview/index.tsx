import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createSelector, JSX, Show } from "solid-js";

import { ChannelTypes } from "@constants/channel";

import ChannelStore from "@stores/channels";
import ConnectionStore from "@stores/connection";
import GuildStore from "@stores/guilds";

import GuildsList from "@components/guilds";

import Chat from "../chat";
import { CurrentPermissionProvider } from "../common/permissionscontext";
import { SelectedChannelContext, SelectedGuildContext } from "../common/selectioncontext";
import SideBar from "../sidebar";
import FriendsView from "./friendsview";
import HeaderBar from "./headerbar";

import "./style.scss";

import shiggy from "@resources/shiggy.gif";

import { lastSelectedChannels, setLastSelectedChannels, setWindowTitle, showMembers, showUserProfile } from "@renderer/signals";

export default function MainView(): JSX.Element {
	const params = useParams(),
		navigate = useNavigate(),
		selectedChannel = createSelector(() => params.channelId),
		selectedGuild = createSelector(() => params.guildId),
		currChannel = createMemo(() =>
			params.guildId === "@me" ? ChannelStore.getDirectMessage(params.channelId) : ChannelStore.getGuildChannel(params.channelId),
		);

	createEffect(() => {
		if (params.guildId === "@me") {
			if (!currChannel() && params.channelId && lastSelectedChannels["@me"]) return navigate("/channels/@me/" + lastSelectedChannels["@me"]);
			setLastSelectedChannels("@me", params.channelId);
			return;
		}

		if (!currChannel()) {
			const sortedChannels = ChannelStore.getSortedGuildChannels(params.guildId);
			const channelId = sortedChannels?.uncategorized.other[0] || sortedChannels?.categorized[0]?.other[0];
			if (channelId) navigate(`/channels/${params.guildId}/${channelId}`);
			return;
		}

		setLastSelectedChannels(params.guildId, params.channelId);
		const subscription = window.gateway.getGuildSubscription(params.guildId);
		if (!subscription) window.gateway.updateGuildSubscription(params.guildId, { activities: true, threads: true, typing: true });
	});

	createEffect(() => {
		const ch = currChannel();
		if (params.guildId === "@me") {
			if (ch)
				setWindowTitle(
					`${(currChannel()?.type === ChannelTypes.DM ? "@" : "") + ChannelStore.getPrivateChannelName(params.channelId)} - Stryfe`,
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
			when={ConnectionStore.uiVisible()}
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
					<CurrentPermissionProvider>
						<div class="main-view">
							<GuildsList />
							<SideBar />
							<div class="channel-wrapper">
								<HeaderBar />
								<div class="channel" style={{ "flex-grow": 1 }}>
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
											{0 /*<MemberList />*/}
										</Show>
										<Show when={showUserProfile() && currChannel()?.type === ChannelTypes.DM}>
											<span>DM User Profile</span>
										</Show>
									</Show>
								</div>
							</div>
						</div>
					</CurrentPermissionProvider>
				</SelectedGuildContext.Provider>
			</SelectedChannelContext.Provider>
		</Show>
	);
}
