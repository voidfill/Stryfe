import { useParams } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import { getCustomStatus } from "@stores/activities";
import { preloadedSettings, setMessageDisplayCompact, setTheme } from "@stores/settings";
import { getSelf, getSelfId } from "@stores/users";

import Avatar from "@components/common/avatar";
import { Choice, ChoiceGroup, ContextmenuDirective, Separator, SubMenu } from "@components/common/contextmenu";
import CustomStatus from "@components/common/customstatus";
import { BiRegularMicrophone } from "solid-icons/bi";
import { FiHeadphones } from "solid-icons/fi";
import { IoSettingsOutline } from "solid-icons/io";

import GuildChannels from "./guildchannels";
import PrivateChannels from "./privatechannels";

import "./style.scss";

ContextmenuDirective;

function SettingsContextMenu(): JSX.Element {
	return (
		<>
			<SubMenu label="Appearance">
				<ChoiceGroup current={preloadedSettings.appearance?.theme || (0 as const)} set={(v) => setTheme(v)}>
					<Choice label="Dark" value={1} />
					<Choice label="Light" value={2} />
					<Choice label="Sync with Computer" value={0} />
				</ChoiceGroup>
				<Separator />
				<ChoiceGroup
					current={preloadedSettings.textAndImages?.messageDisplayCompact?.value ?? false}
					set={(v) => setMessageDisplayCompact(v)}
				>
					<Choice label="Cozy" value={false} />
					<Choice label="Compact" value={true} />
				</ChoiceGroup>
			</SubMenu>
		</>
	);
}

function UserArea(): JSX.Element {
	const self = createMemo(() => getSelf());
	const displayName = createMemo(() => self()?.display_name || self()?.username);
	const hasCustomStatus = createMemo(() => {
		return !!getCustomStatus(getSelfId());
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
				<button class="user-button settings" aria-roledescription="Settings" use:ContextmenuDirective={() => <SettingsContextMenu />}>
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
