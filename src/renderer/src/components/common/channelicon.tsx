import { createMemo, JSX, Match, Show, Switch } from "solid-js";

import { ChannelTypes } from "@constants/channel";
import permissions from "@constants/permissions";

import { getGuildChannel, hasThreads } from "@stores/channels";
import { computeChannelOverwrites, hasBit } from "@stores/permissions";
import { getRole } from "@stores/roles";

import { FaSolidHashtag, FaSolidImage, FaSolidLock, FaSolidTriangleExclamation } from "solid-icons/fa";
import { HiOutlineChatBubbleLeftRight, HiOutlineSpeakerWave, HiSolidChatBubbleLeft } from "solid-icons/hi";
import { RiBusinessMegaphoneLine, RiMapSignalTowerLine } from "solid-icons/ri";

import tippy from "./tooltip";

import "./channelicon.scss";

tippy;

export function RawChannelIcon(props: { size: number; type: ChannelTypes }): JSX.Element {
	return (
		<Switch fallback={<></>}>
			<Match when={props.type === ChannelTypes.GUILD_TEXT}>
				<FaSolidHashtag size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.GUILD_VOICE}>
				<HiOutlineSpeakerWave size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.GUILD_CATEGORY}>
				<FaSolidHashtag size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.GUILD_ANNOUNCEMENT}>
				<RiBusinessMegaphoneLine size={props.size} />
			</Match>
			{/* <Match when={props.type === ChannelTypes.ANNOUNCEMENT_THREAD}>
				<FaSolidHashtag size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.PUBLIC_THREAD}>
				<FaSolidHashtag size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.PRIVATE_THREAD}>
				<FaSolidHashtag size={props.size} />
			</Match> */}
			<Match when={props.type === ChannelTypes.GUILD_STAGE_VOICE}>
				<RiMapSignalTowerLine size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.GUILD_FORUM}>
				<HiOutlineChatBubbleLeftRight size={props.size} />
			</Match>
			<Match when={props.type === ChannelTypes.GUILD_MEDIA}>
				<FaSolidImage size={props.size} />
			</Match>
		</Switch>
	);
}

export function channelTypeToText(type: ChannelTypes): string {
	switch (type) {
		case ChannelTypes.GUILD_TEXT:
			return "Text";
		case ChannelTypes.GUILD_VOICE:
			return "Voice";
		case ChannelTypes.GUILD_CATEGORY:
			return "Category";
		case ChannelTypes.GUILD_ANNOUNCEMENT:
			return "Announcement";
		case ChannelTypes.GUILD_STAGE_VOICE:
			return "Stage";
		case ChannelTypes.GUILD_FORUM:
			return "Forum";
		case ChannelTypes.GUILD_MEDIA:
			return "Media";
		default:
			return "Unknown";
	}
}

export function ModifiedIcon(props: { hasThreads: boolean; isLimited: boolean; isNSFW: boolean; size: number; type: ChannelTypes }): JSX.Element {
	const clipPath = createMemo(() => {
		if (props.hasThreads && (props.isLimited || props.isNSFW)) return "polygon(55% 0, 55% 50%, 45% 50%, 45% 100%, 0 100%, 0 0)";
		if (props.isLimited || props.isNSFW) return "polygon(55% 0, 55% 45%, 100% 45%, 100% 100%, 0 100%, 0 0)";
		if (props.hasThreads) return "polygon(100% 50%, 45% 50%, 45% 100%, 0 100%, 0 0)";
		return "polygon(0 0, 0 100%, 100% 100%, 100% 0)";
	});

	return (
		<svg
			class="channel-icon"
			width={`${props.size}px`}
			height={`${props.size}px`}
			use:tippy={{
				content: () =>
					channelTypeToText(props.type) + (props.isLimited || props.isNSFW ? ` (${props.isNSFW ? "Age-Restricted" : "Limited"})` : ""),
				props: {
					delay: [300, 0],
				},
			}}
		>
			<foreignObject
				width={`${props.size * (4 / 5)}px`}
				height={`${props.size * (4 / 5)}px`}
				x={props.size / 10}
				y={props.size / 10}
				style={{
					"clip-path": clipPath(),
				}}
			>
				<RawChannelIcon size={props.size * (4 / 5)} type={props.type} />
			</foreignObject>
			<Show when={props.isLimited || props.isNSFW}>
				<Show
					when={props.isNSFW}
					fallback={<FaSolidLock x={`${props.size * (11 / 20)}px`} y={`${props.size / 40}px`} size={`${props.size * (2 / 5)}px`} />}
				>
					<FaSolidTriangleExclamation x={`${props.size * (11.5 / 20)}px`} y={`${props.size / 40}px`} size={`${props.size * (2 / 5)}px`} />
				</Show>
			</Show>
			<Show when={props.hasThreads}>
				<HiSolidChatBubbleLeft x={`${props.size / 2}px`} y={`${props.size / 2}px`} size={`${props.size / 2}px`} />
			</Show>
		</svg>
	);
}

export default function ChannelIcon(props: { guildId: string; id: string; size: number }): JSX.Element {
	const channel = createMemo(() => getGuildChannel(props.id) /* ||  getThread(props.id) */),
		threads = createMemo(() => hasThreads(props.id)),
		everyonePermissions = createMemo(() => getRole(props.guildId)?.permissions ?? permissions.NONE),
		everyoneOverwrites = createMemo(() => computeChannelOverwrites(everyonePermissions(), props.guildId, props.id, "no one")),
		isLimited = createMemo(() => !hasBit(everyoneOverwrites(), permissions.VIEW_CHANNEL));

	return (
		<Show when={channel()}>
			{(channel): JSX.Element => (
				<ModifiedIcon
					hasThreads={channel().type !== ChannelTypes.GUILD_FORUM && channel().type !== ChannelTypes.GUILD_MEDIA && threads()}
					isLimited={isLimited()}
					isNSFW={((): boolean => {
						const c = channel();
						if (!("nsfw" in c)) return false;
						return c.nsfw || false;
					})()}
					size={props.size}
					type={channel().type}
				/>
			)}
		</Show>
	);
}
