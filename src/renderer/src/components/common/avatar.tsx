import { createMemo, JSX, Show } from "solid-js";

import ActivityStore from "@stores/activities";
import ChannelStore from "@stores/channels";
import StatusStore, { Status as StatusEnum, statusToText } from "@stores/status";
import TypingStore from "@stores/typing";
import UserStore from "@stores/users";

import { useAnimationContext } from "./animationcontext";
import TooltipDirective from "./tooltip";

import "./avatar.scss";

TooltipDirective;

const theta = (Math.PI * 25) / 100;

// old mask instead of rect
// <circle cx={props.size / 2} cy={props.size / 2} r={props.size / 2} fill="white" />

function Mask(props: { isTyping: boolean; maskId: string; showStatus: boolean; size: number }): JSX.Element {
	const statusRadius = createMemo(() => props.size / 2.25);

	return (
		<mask id={props.maskId} class="avatar-mask">
			<rect x={0} y={0} width={props.size} height={props.size} fill="white" />
			<Show when={props.showStatus}>
				<rect
					x={props.size / 2 + (props.size / 2) * Math.cos(theta) - (props.isTyping ? statusRadius() * 1.1 : statusRadius() / 2)}
					y={props.size / 2 + (props.size / 2) * Math.sin(theta) - statusRadius() / 2}
					width={props.isTyping ? statusRadius() * 2.5 : statusRadius()}
					height={statusRadius()}
					fill="black"
					rx={statusRadius() / 2}
				/>
			</Show>
		</mask>
	);
}

export const enum ShowStatus {
	NEVER,
	ALWAYS,
	NO_OFFLINE,
}

type avatarProps = {
	size: 16 | 20 | 24 | 32 | 40 | 56 | 80 | 128;
} & (
	| {
			channelId?: string;
			guildId?: string;
			noTyping?: boolean;
			showStatus?: ShowStatus;
			userId: string;
	  }
	| {
			groupDMId: string;
	  }
);

let maskCounter = 0;

export default function Avatar(props: avatarProps): JSX.Element {
	const maskId = `avatar-mask-${maskCounter++}`;
	const shouldAnimate = useAnimationContext();

	const avatarUrl = createMemo(() => {
		if ("groupDMId" in props) return ChannelStore.getPrivateChannelIcon(props.groupDMId, props.size, shouldAnimate());

		if ("guildId" in props) return ChannelStore.getRandomGroupIconUrl(); // TODO: server pfps

		return UserStore.getAvatarUrl(props.userId, props.size, shouldAnimate());
	});
	const status = createMemo(() => ("groupDMId" in props ? StatusEnum.OFFLINE : StatusStore.getStatus(props.userId)));
	const isTyping = createMemo(() => {
		if ("groupDMId" in props) return false;
		if (!props.channelId) return false;

		return !props.noTyping && TypingStore.isTypingInChannel(props.channelId, props.userId);
	});
	const shouldShowStatus = createMemo(() => {
		if ("groupDMId" in props) return false;

		switch (props.showStatus) {
			case ShowStatus.ALWAYS:
				return true;
			case ShowStatus.NEVER:
				return false;
			default:
				return status() !== StatusEnum.OFFLINE;
		}
	});
	const isStreaming = createMemo(() => "userId" in props && ActivityStore.isStreaming(props.userId));

	return (
		<svg class="avatar" width={props.size} height={props.size}>
			<Show
				when={"userId" in props}
				fallback={
					<foreignObject height={props.size} width={props.size}>
						<img height={props.size} width={props.size} src={avatarUrl()} />
					</foreignObject>
				}
			>
				<Mask size={props.size} maskId={maskId} showStatus={shouldShowStatus()} isTyping={isTyping()} />
				<foreignObject height={props.size} width={props.size} style={{ mask: `url(#${maskId})` }}>
					<img height={props.size} width={props.size} src={avatarUrl()} />
				</foreignObject>
				<Show when={shouldShowStatus()}>
					<Status
						userId={("userId" in props && props.userId) || "this wont happen so its ok"}
						isStreaming={isStreaming()}
						isTyping={isTyping()}
						size={props.size / 3.2}
						status={status()}
						x={props.size / 2 + (props.size / 2) * Math.cos(theta) - props.size / 2.55}
						y={props.size / 2 + (props.size / 2) * Math.sin(theta) - props.size / 6.5}
					/>
				</Show>
			</Show>
		</svg>
	);
}

// use:TooltipDirective={{
// 	content: (): JSX.Element => (
// 		<Show when={props.status !== StatusEnum.OFFLINE && fullStatus()} keyed fallback={<p>Offline</p>}>
// 			{(fullStatus): JSX.Element => (
// 				<div>
// 					<p>Mobile: {statusToText(fullStatus[0])}</p>
// 					<p>Desktop: {statusToText(fullStatus[1])}</p>
// 					<p>Web: {statusToText(fullStatus[2])}</p>
// 				</div>
// 			)}
// 		</Show>
// 	),
// }}

export function Status(props: {
	isStreaming: boolean;
	isTyping: boolean;
	size: number;
	status: StatusEnum;
	userId: string;
	x?: number;
	y?: number;
}): JSX.Element {
	const maskId = `status-mask-${maskCounter++}`;
	const statusAsText = createMemo(() => {
		if (props.isStreaming) return "streaming";

		switch (props.status) {
			case StatusEnum.ONLINE:
				return "online";
			case StatusEnum.IDLE:
				return "idle";
			case StatusEnum.DND:
				return "dnd";
			default:
				return "offline";
		}
	});
	const fullStatus = createMemo(() => StatusStore.getFullStatus(props.userId));
	// TODO: tooltip with statuses per platform

	const antiRectProps = createMemo<{
		height: number;
		rx: number | string;
		width: number;
		x: number;
		y: number;
	}>(() => {
		if (props.isTyping || props.isStreaming || props.status === StatusEnum.ONLINE) {
			return {
				height: 0,
				rx: "100%",
				width: 0,
				x: props.size * 1.25,
				y: props.size * 0.3,
			};
		}

		if (props.status === StatusEnum.DND) {
			return {
				height: props.size * 0.25,
				rx: props.size * 0.125,
				width: props.size * 0.7,
				x: props.size * 0.9,
				y: props.size * 0.375,
			};
		}

		if (props.status === StatusEnum.IDLE) {
			return {
				height: props.size * 0.8,
				rx: "100%",
				width: props.size * 0.8,
				x: props.size * 0.65,
				y: props.size * -0.15,
			};
		}

		return {
			height: props.size * 0.6,
			rx: "100%",
			width: props.size * 0.6,
			x: props.size * 0.95,
			y: props.size * 0.2,
		};
	});

	return (
		<svg
			classList={{
				status: true,
				[`status-${statusAsText()}`]: true,
				"status-typing": props.isTyping,
			}}
			width={2.5 * props.size}
			height={props.size}
			x={props.x ?? 0}
			y={props.y ?? 0}
		>
			<mask id={maskId}>
				<rect
					fill="white"
					x={props.isTyping ? 0 : 0.75 * props.size}
					y={0}
					width={props.isTyping ? 2.5 * props.size : props.size}
					height={props.size}
					rx={props.size / 2}
				/>
				<rect fill="black" {...antiRectProps()} />
			</mask>
			<rect class="status-status" width="100%" height="100%" mask={`url(#${maskId})`} />
			<circle
				class="typing-circle circle-0"
				style={{ "animation-delay": "0.5s" }}
				cx={(props.isTyping ? 0.5 : 1.25) * props.size}
				cy={props.size / 2}
				r={props.size / 3}
			/>
			<circle
				class="typing-circle circle-1"
				style={{ "animation-delay": "1s" }}
				cx={props.size * 1.25}
				cy={props.size / 2}
				r={props.size / 3}
			/>
			<circle
				class="typing-circle circle-2"
				style={{ "animation-delay": "1.5s" }}
				cx={(props.isTyping ? 2 : 1.25) * props.size}
				cy={props.size / 2}
				r={props.size / 3}
			/>
		</svg>
	);
}
