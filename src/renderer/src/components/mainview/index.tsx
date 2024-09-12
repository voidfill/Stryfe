import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createSelector, JSX, Match, Show, Switch } from "solid-js";

import { ChannelTypes } from "@constants/channel";

import { getDirectMessage, getGuildChannel, getPrivateChannelName, getSortedGuildChannels } from "@stores/channels";
import { firstConnect, tlState, trace, uiVisible } from "@stores/connection";
import { getGuild } from "@stores/guilds";

import { Timeline, TimelineItem } from "@components/common/timeline";
import GuildsList from "@components/guilds";

import Chat from "../chat";
import { LocationContext } from "../common/locationcontext";
import { CurrentPermissionProvider } from "../common/permissionscontext";
import { ShadowCss } from "../common/shadowcss";
import MemberList from "../memberlist";
import SideBar from "../sidebar";
import FriendsView from "./friendsview";
import HeaderBar from "./headerbar";
import mainviewcss from "./style.css@sheet";

import shiggy from "@resources/highres_shiggy.png";

import { lastSelectedChannels, setLastSelectedChannels, setWindowTitle, showDMUserProfile, showMembers } from "@renderer/signals";

function NotConnected(): JSX.Element {
	const traceData = createMemo(() => {
		const t = trace();
		if (!t) return null;
		try {
			const d = JSON.parse(t[0]);
			return { micros: d[1].micros, via: d[0] };
		} catch {
			return null;
		}
	});

	return (
		<div class="not-connected">
			<div class="icon-container">
				<img class="shiggy" src={shiggy} alt="shiggy" />
				<h2>Stryfe</h2>
			</div>
			<Show
				when={firstConnect()}
				fallback={
					<span>Connecting...</span>
					// TODO: display out of retries etc
				}
			>
				<Timeline state={tlState()}>
					<TimelineItem title="Connection Open" />
					<TimelineItem title="Hello Received" />
					<TimelineItem
						title="Ready"
						description={
							<Show when={traceData()}>
								{(t) => (
									<>
										<div>via {t().via}</div>
										<div>in {t().micros / 1000}ms</div>
									</>
								)}
							</Show>
						}
					/>
					<TimelineItem title="Ready Supplemental" />
				</Timeline>
			</Show>
		</div>
	);
}

export default function MainView(): JSX.Element {
	const params = useParams(),
		navigate = useNavigate(),
		selectedChannel = createSelector(() => params.channelId),
		selectedGuild = createSelector(() => params.guildId),
		currChannel = createMemo(() => (params.guildId === "@me" ? getDirectMessage(params.channelId) : getGuildChannel(params.channelId)));

	createEffect(() => {
		if (params.guildId === "@me") {
			if (!currChannel() && params.channelId && lastSelectedChannels["@me"]) return navigate("/channels/@me/" + lastSelectedChannels["@me"]);
			setLastSelectedChannels("@me", params.channelId);
			return;
		}

		if (!currChannel()) {
			const sortedChannels = getSortedGuildChannels(params.guildId);
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
			if (ch) setWindowTitle(`${(currChannel()?.type === ChannelTypes.DM ? "@" : "") + getPrivateChannelName(params.channelId)} - Stryfe`);
			else setWindowTitle("Friends - Stryfe");
			return;
		}
		if (ch) setWindowTitle(`#${"name" in ch ? ch.name : params.channelId} | ${getGuild(params.guildId)?.name ?? params.guildId} - Stryfe`);
		else setWindowTitle("Stryfe");
	});

	return (
		<ShadowCss css={mainviewcss}>
			<Show when={uiVisible()} fallback={<NotConnected />}>
				<LocationContext.Provider
					value={() => ({
						channelId: params.channelId,
						guildId: params.guildId,
						messageId: params.messageId || undefined,
						selectedChannel,
						selectedGuild,
					})}
				>
					<CurrentPermissionProvider>
						<div class="main-view">
							<GuildsList />
							<SideBar />
							<div class="channel-wrapper">
								<HeaderBar />
								<div class="channel" style={{ display: "flex", "flex-direction": "row", "flex-grow": 1 }}>
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
										<Switch
											fallback={
												<>
													<Chat />
													<Show when={showMembers() && params.channelId && currChannel()?.type !== ChannelTypes.DM}>
														<MemberList />
													</Show>
													<Show when={showDMUserProfile() && currChannel()?.type === ChannelTypes.DM}>
														<span>DM User Profile</span>
													</Show>
												</>
											}
										>
											<Match
												when={
													currChannel()?.type === ChannelTypes.GUILD_FORUM ||
													currChannel()?.type === ChannelTypes.GUILD_MEDIA
												}
											>
												forum/media channel
											</Match>
											<Match when={currChannel()?.type === ChannelTypes.GUILD_DIRECTORY}>directory channel</Match>
										</Switch>
									</Show>
								</div>
							</div>
						</div>
					</CurrentPermissionProvider>
				</LocationContext.Provider>
			</Show>
		</ShadowCss>
	);
}
