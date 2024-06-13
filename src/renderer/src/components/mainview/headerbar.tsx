import { createMemo, JSX, Match, Show, Switch } from "solid-js";

import { ChannelTypes } from "@constants/channel";

import ChannelStore from "@stores/channels";
import UserStore from "@stores/users";

import tippy from "@components/common/tooltip";
import { FaSolidCircleUser } from "solid-icons/fa";
import { FiHelpCircle, FiUsers } from "solid-icons/fi";

import Avatar, { ShowStatus } from "../common/avatar";
import ChannelIcon from "../common/channelicon";
import { useLocationContext } from "../common/locationcontext";
import { parse } from "../common/md";
import { ModalDirective } from "../common/modals";
import { GenericModal, ModalHeader } from "../common/modals";

import "./headerbar.scss";

import {
	friendsTab,
	FriendsTabs,
	setFriendsTab,
	setShowDMUserProfile,
	setShowMembers,
	showDMUserProfile,
	showHelp,
	showMembers,
} from "@renderer/signals";

tippy;
ModalDirective;

const threadChannelTypes = new Set([ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD, ChannelTypes.ANNOUNCEMENT_THREAD]);

function FriendsHeaderButtons(): JSX.Element {
	return (
		<>
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
		</>
	);
}

function DM(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getDirectMessage(props.id));
	const userId = createMemo(() => channel()?.recipient_ids[0]);
	const user = createMemo(() => UserStore.getUser(userId()));

	return (
		<>
			<Avatar userId={userId()} size={24} showStatus={ShowStatus.ALWAYS} noTyping />
			<span class="username" use:tippy={{ content: () => user()?.username }}>
				{user()?.display_name || user()?.username}
			</span>
		</>
	);
}

function GroupDM(props: { id: string }): JSX.Element {
	const name = createMemo(() => ChannelStore.getPrivateChannelName(props.id));

	function onChangeName(newName: string): void {
		// TODO: make api call, optimistically set name
	}

	return (
		<>
			<Avatar groupDMId={props.id} size={24} />
			<input class="group-dm-name" value={name()} onChange={(e): void => onChangeName(e.target.value)} />
		</>
	);
}

function Thread(props: { id: string }): JSX.Element {
	return <span>Thread</span>;
}

function Forum(props: { id: string }): JSX.Element {
	const channelName = createMemo(() => ChannelStore.getGuildChannel(props.id)?.name);
	return <span class="channel-name">{channelName()}</span>;
}

function TopicModal(props: { channelId: string }): JSX.Element {
	const topic = createMemo(() => {
		const c = ChannelStore.getGuildChannel(props.channelId);
		if (!c || !("topic" in c) || !c.topic) return "";
		return c.topic;
	});
	const parsed = createMemo(() => parse(topic(), { allowHeading: true, formatInline: true, inline: true, outputData: {} }));
	const channelName = createMemo(() => ChannelStore.getGuildChannel(props.channelId)?.name);

	return (
		<GenericModal>
			<ModalHeader title={"#" + channelName()} closeButton />
			<div style={{ padding: "16px", width: "490px" }}>{parsed().element}</div>
		</GenericModal>
	);
}

function TextOrVoice(props: { id: string }): JSX.Element {
	const channel = createMemo(() => ChannelStore.getGuildChannel(props.id));
	const topic = createMemo(() => {
		const c = channel();
		if (!c || !("topic" in c) || !c.topic) return "";
		return c.topic;
	});

	return (
		<Show when={channel()}>
			<>
				<span class="channel-name">{channel()?.name}</span>
				<Show when={topic()} keyed>
					{(t) => (
						<>
							<div class="topic-divider" />
							<div class="channel-topic md-format-inline" use:ModalDirective={{ content: () => <TopicModal channelId={props.id} /> }}>
								{parse(t, { allowHeading: true, formatInline: true, inline: true, outputData: {} }).element}
							</div>
						</>
					)}
				</Show>
			</>
		</Show>
	);
}

export default function HeaderBar(): JSX.Element {
	const location = useLocationContext(),
		type = createMemo(() => ChannelStore.getChannel(location().channelId)?.type);

	return (
		<div class="header-bar">
			<div class="left">
				<Show
					when={location().guildId !== "@me"}
					fallback={
						<Switch fallback={<FriendsHeaderButtons />}>
							<Match when={type() === ChannelTypes.DM}>
								<DM id={location().channelId} />
							</Match>
							<Match when={type() === ChannelTypes.GROUP_DM}>
								<GroupDM id={location().channelId} />
							</Match>
						</Switch>
					}
				>
					<ChannelIcon id={location().channelId} guildId={location().guildId} size={28} />
					<Switch fallback={<span>No Text Channel Selected</span>}>
						<Match when={threadChannelTypes.has(type() as ChannelTypes)}>
							<Thread id={location().channelId} />
						</Match>
						<Match when={type() === ChannelTypes.GUILD_FORUM || type() === ChannelTypes.GUILD_MEDIA}>
							<Forum id={location().channelId} />
						</Match>
						<Match when={type() !== undefined}>
							<TextOrVoice id={location().channelId} />
						</Match>
					</Switch>
				</Show>
			</div>
			<div class="right">
				<Show when={type() !== undefined && type() !== ChannelTypes.DM}>
					<button
						classList={{
							active: showMembers(),
							"members-button": true,
						}}
						onClick={() => setShowMembers((p): boolean => !p)}
					>
						<FiUsers class="icon" size={24} />
					</button>
				</Show>
				<Show when={type() === ChannelTypes.DM}>
					<button
						classList={{
							active: showDMUserProfile(),
							"dm-user-profile-button": true,
						}}
						onClick={() => setShowDMUserProfile((p): boolean => !p)}
					>
						<FaSolidCircleUser class="icon" size={24} />
					</button>
				</Show>
				<Show when={location().channelId}>
					<span>Search</span>
				</Show>
				<Show when={showHelp()}>
					<button class="help-button" onClick={(): void => {}}>
						<FiHelpCircle class="icon" size={24} />
					</button>
				</Show>
			</div>
		</div>
	);
}
