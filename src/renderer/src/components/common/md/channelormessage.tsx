import { useNavigate } from "@solidjs/router";
import { createMemo, JSX, Show } from "solid-js";

import { ChannelTypes } from "@constants/channel";
import Permissions from "@constants/permissions";

import { getChannel, getChannelName } from "@stores/channels";
import { getGuild } from "@stores/guilds";
import { can } from "@stores/permissions";
import { getSelfId } from "@stores/users";

import { BsChatLeftText } from "solid-icons/bs";

import { useLocationContext } from "../locationcontext";
import { ruleTypeGuard } from "./lib";
import { MentionBox } from "./util";

type d = {
	channelId: string;
	guildId: string | null;
	messageId: string | null;
};

function ChannelOrMessage(props: d): JSX.Element {
	const channel = createMemo(() => getChannel(props.channelId));
	const channelName = createMemo(() => getChannelName(props.channelId));
	const guildId = createMemo(() => {
		const c = channel();
		if (!c || !("guild_id" in c)) return null;
		return c.guild_id;
	});
	const canAccess = createMemo<boolean>(() => {
		const c = channel();
		if (!c) return false;
		if (c.type === ChannelTypes.DM || c.type === ChannelTypes.GROUP_DM) return true;
		const gid = guildId();
		if (!gid) return false;
		return can({
			channelId: props.channelId,
			guildId: gid,
			memberId: getSelfId(),
			toCheck: Permissions.VIEW_CHANNEL,
		});
	});
	const guild = createMemo(() => {
		return guildId() ? getGuild(guildId()!) : null;
	});
	const location = useLocationContext();
	const isSameGuild = createMemo(() => guildId() === location().guildId);

	const navigate = useNavigate();

	return (
		<MentionBox
			onClick={(): void => {
				if (!channel() || !canAccess()) return; // TODO: error message ?
				navigate(`/channels/${guildId() ?? "@me"}/${props.channelId}${props.messageId ? `/${props.messageId}` : ""}`);
			}}
		>
			<Show when={channelName()} fallback={"# unknown"}>
				<Show when={canAccess()} fallback={"No Access"}>
					<Show when={!isSameGuild() && guild()}>
						{(g) => (
							<>
								{g().name}
								{" > "}
							</>
						)}
					</Show>
					# {channelName()}
					<Show when={props.messageId}>
						{" > "}
						<BsChatLeftText size={16} />
					</Show>
				</Show>
			</Show>
		</MentionBox>
	);
}

export const channelmention = ruleTypeGuard<d>({
	doesMatch: (source) => {
		const match = /^<#(\d+)>/.exec(source);
		if (!match) return null;
		return {
			capture: match[0],
			data: {
				channelId: match[1],
				guildId: null,
				messageId: null,
			},
		};
	},
	element: ChannelOrMessage,
	order: 24,
	requiredFirstCharacters: "<#",
});

export const channelormessage = ruleTypeGuard<d>({
	doesMatch: (source) => {
		const match = /^https:\/\/(?:canary\.|ptb\.)?discord.com\/channels\/(\d+|@me)(?:\/(\d+|[a-zA-Z-]+))?(?:\/(\d+|[a-zA-Z-]+))?/.exec(source);
		if (!match || /\D/.test(match[2] + (match[3] ?? ""))) return null;
		return {
			capture: match[0],
			data: {
				channelId: match[2],
				guildId: match[1] === "@me" ? null : match[1],
				messageId: match[3] || null,
			},
		};
	},
	element: ChannelOrMessage,
	order: 15.5,
	requiredFirstCharacters: "https://",
});
