import { Navigate, useNavigate, useParams } from "@solidjs/router";
import { JSX, Show, createEffect, createSelector } from "solid-js";
import { createStore } from "solid-js/store";
import Storage from "@modules/storage";
import { SelectedChannelContext, SelectedGuildContext } from "../common/selectioncontextprovider";

import ConnectionStore from "@stores/connection";

import GuildsList from "@components/guilds";

import "./style.scss";
import shiggy from "@resources/shiggy.gif";

const [lastSelectedChannel, setLastSelectedChannel] = createStore<{
	[key: string]: string | undefined;
}>({ ...Storage.get("lastSelectedChannels", {}), "@me": undefined });
export { lastSelectedChannel };

export default function MainView(): JSX.Element {
	// we do not want to run all the setup if its just gonna navigate away.
	// eslint-disable-next-line solid/components-return-once
	if (!Storage.has("token")) return <Navigate href="/login" />;

	const params = useParams(),
		navigate = useNavigate(),
		selectedChannel = createSelector(() => params.channel),
		selectedGuild = createSelector(() => params.guildId);

	createEffect(() => {
		setLastSelectedChannel(params.guildId, params.channelId);
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
						{JSON.stringify(params)}
						{/* <ChannelsSidebar />
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
			</div> */}
					</div>
				</SelectedGuildContext.Provider>
			</SelectedChannelContext.Provider>
		</Show>
	);
}
