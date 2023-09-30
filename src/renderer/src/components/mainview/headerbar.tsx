import { useParams } from "@solidjs/router";
import { createMemo, createSignal, JSX, Match, Show, Switch } from "solid-js";

import Storage from "@modules/storage";

import ChannelStore from "@stores/channels";

import { FiHelpCircle } from "solid-icons/fi";

import ChannelIcon from "../common/channelicon";

import { ChannelTypes } from "@renderer/constants/channel";

const threadChannelTypes = new Set([ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD, ChannelTypes.ANNOUNCEMENT_THREAD]);

const [showMembers, setShowMembers] = createSignal(Storage.get("showMembers", true));
const [showUserProfile, setShowUserProfile] = createSignal(Storage.get("showUserProfile", true));
const [showHelp, setShowHelp] = createSignal(Storage.get("showHelp", true));
export { showMembers, showUserProfile };

export default function HeaderBar(): JSX.Element {
	const params = useParams(),
		channelType = createMemo((): ChannelTypes => ChannelStore.getChannel(params.channelId)?.type);

	return (
		<div class="header-bar">
			<Switch fallback={<></>}>
				<Match when={params.guildId === "@me" && channelType() === undefined}>
					<span>Friends</span>
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
			<Show when={showHelp()}>
				<button class="help-button" onClick={(): void => {}}>
					<FiHelpCircle class="icon" size={24} />
				</button>
			</Show>
		</div>
	);
}
