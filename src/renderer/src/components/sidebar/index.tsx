import { useParams } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import ActivityStore from "@stores/activities";
import UserStore from "@stores/users";

import { BiRegularMicrophone } from "solid-icons/bi";
import { FiHeadphones } from "solid-icons/fi";
import { IoSettingsOutline } from "solid-icons/io";

import Avatar from "../common/avatar";
import CustomStatus from "../common/customstatus";
import GuildChannels from "./guildchannels";
import PrivateChannels from "./privatechannels";

import "./style.scss";

function UserArea(): JSX.Element {
	const self = createMemo(() => UserStore.getSelf());
	const displayName = createMemo(() => self()?.display_name || self()?.username);
	const hasCustomStatus = createMemo(() => {
		return !!ActivityStore.getCustomStatus(UserStore.getSelfId());
	});

	return (
		<div class="user-area">
			<button class="avatar-wrapper">
				<Show when={self()}>
					{(user): JSX.Element => (
						<>
							<Avatar size={32} userId={user().id} noTyping />
							<div class="user-info">
								<span class="user-display-name">{displayName()}</span>
								<Show when={hasCustomStatus()} fallback={<span class="user-name">{user().username}</span>}>
									<div class="text-roll">
										<div class="default status">
											<CustomStatus userId={user().id} noToolTip />
										</div>
										<span class="hover user-name">{user().username}</span>
									</div>
								</Show>
							</div>
						</>
					)}
				</Show>
			</button>
			<div class="user-buttons">
				<button class="user-button mute" aria-roledescription="Mute">
					<BiRegularMicrophone size={20} />
				</button>
				<button class="user-button deafen" aria-roledescription="Deafen">
					<FiHeadphones size={20} />
				</button>
				<button class="user-button settings" aria-roledescription="Settings">
					<IoSettingsOutline size={20} />
				</button>
			</div>
		</div>
	);
}

export default function SideBar(): JSX.Element {
	const params = useParams();

	return (
		<div class="sidebar">
			<Show when={params.guildId === "@me"} fallback={<GuildChannels />}>
				<PrivateChannels />
			</Show>
			<UserArea />
		</div>
	);
}
