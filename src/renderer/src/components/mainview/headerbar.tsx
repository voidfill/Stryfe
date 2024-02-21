import { useParams } from "@solidjs/router";
import { createMemo, JSX, Match, Show, Switch } from "solid-js";

import ChannelStore from "@stores/channels";

import { FiHelpCircle, FiUsers } from "solid-icons/fi";

import { ChannelTypes } from "@renderer/constants/channel";
import { friendsTab, FriendsTabs, setFriendsTab, showHelp } from "@renderer/signals";

const threadChannelTypes = new Set([ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD, ChannelTypes.ANNOUNCEMENT_THREAD]);

export default function HeaderBar(): JSX.Element {
	const params = useParams(),
		channelType = createMemo((): ChannelTypes => ChannelStore.getChannel(params.channelId)?.type);

	return (
		<div class="header-bar">
			<Switch fallback={<></>}>
				<Match when={params.guildId === "@me" && channelType() === undefined}>
					<FiUsers size={24} />
					<span>Friends</span>
					<button
						classList={{
							"friends-button": true,
							selected: friendsTab() === FriendsTabs.ONLINE,
						}}
						onClick={(): void => void setFriendsTab(FriendsTabs.ONLINE)}
					>
						Online
					</button>
					<button
						classList={{
							"friends-button": true,
							selected: friendsTab() === FriendsTabs.ALL,
						}}
						onClick={(): void => void setFriendsTab(FriendsTabs.ALL)}
					>
						All
					</button>
					<button
						classList={{
							"friends-button": true,
							selected: friendsTab() === FriendsTabs.PENDING,
						}}
						onClick={(): void => void setFriendsTab(FriendsTabs.PENDING)}
					>
						Pending
					</button>
					<button
						classList={{
							"friends-button": true,
							selected: friendsTab() === FriendsTabs.BLOCKED,
						}}
						onClick={(): void => void setFriendsTab(FriendsTabs.BLOCKED)}
					>
						Blocked
					</button>
					<button
						classList={{
							"friends-button": true,
							selected: friendsTab() === FriendsTabs.ADD,
						}}
						onClick={(): void => void setFriendsTab(FriendsTabs.ADD)}
					>
						Add Friend
					</button>
				</Match>
				<Match when={params.guildId === "@me" && channelType() === ChannelTypes.GROUP_DM}>
					<span>Group DM</span>
				</Match>
				<Match when={params.guildId === "@me" && channelType() !== undefined}>
					<span>DM</span>
				</Match>
				<Match when={params.guildId !== "@me" && channelType() === undefined}>
					<span>No Channels?</span>
				</Match>
				<Match when={params.guildId !== "@me" && threadChannelTypes.has(channelType())}>
					<span>Thread</span>
				</Match>
				<Match when={params.guildId !== "@me" && channelType() !== undefined}>
					<span>Normal Channel</span>
				</Match>
			</Switch>
			<div class="divider" />
			<Show when={showHelp()}>
				<button class="help-button" onClick={(): void => {}}>
					<FiHelpCircle class="icon" size={24} />
				</button>
			</Show>
		</div>
	);
}
