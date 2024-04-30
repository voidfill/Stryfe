import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";
import { boolean, fallback, Output } from "valibot";

import { MessageType } from "@constants/message";
import _attachment from "@constants/schemata/message/attachment";

import { extractTimeStamp } from "@modules/unix";

import MemberStore from "@stores/members";
import MessageStore from "@stores/messages";
import RoleStore from "@stores/roles";
import SettingsStore from "@stores/settings";
import UserStore from "@stores/users";

import { HoverAnimationDirective } from "@components/common/animationcontext";
import Avatar, { ShowStatus } from "@components/common/avatar";

import "./message.scss";

import Persistent from "@renderer/stores/persistent";

HoverAnimationDirective;

type attachment = Output<typeof _attachment>;

const isCompact = createMemo(() => SettingsStore.preloadedSettings.textAndImages?.messageDisplayCompact?.value ?? false);
export const [showAvatarsInCompact, setShowAvatarsInCompact] = Persistent.registerSignal("showAvatarsInCompact", fallback(boolean(), true));

function UserName(props: { guildId?: string; id: string }): JSX.Element {
	const member = createMemo(() => (props.guildId ? MemberStore.getMember(props.guildId, props.id) : undefined));
	const user = createMemo(() => UserStore.getUser(props.id));
	const color = createMemo<string>(() => {
		if (!member()) return "#fff";
		const highest = RoleStore.getHighestColoredForMember(props.guildId!, props.id);
		if (highest) {
			const role = RoleStore.getRole(highest);
			if (typeof role?.color === "number") return "#" + role.color.toString(16).padStart(6, "0");
		}
		return "#fff";
	});

	return (
		<div style={{ color: color() }}>
			<Show when={member() && member()?.nick} fallback={user()?.display_name || user()?.username}>
				{member()?.nick}
			</Show>
		</div>
	);
}

function Content(props: { content: string }): JSX.Element {
	return <span class="message-content">{props.content}</span>;
}

function Reply(props: { guildId?: string; id: string }): JSX.Element {
	return <div class="message-reply">imagine this is a reply</div>;
}

function Attachment(props: attachment): JSX.Element {
	return (
		<div class="message-attachment">
			<Switch fallback={"imagine this is an attachment" + JSON.stringify(props)}>
				<Match when={props.content_type?.startsWith("image/")}>
					<img src={props.proxy_url} alt={props.filename} />
				</Match>
			</Switch>
		</div>
	);
}

export default function Message(props: { guildId?: string; id: string; prevId?: string }): JSX.Element {
	const msg = createMemo(() => MessageStore.getMessage(props.id));
	const state = createMemo(() => MessageStore.getMessageState(props.id));
	const date = createMemo(() => extractTimeStamp(props.id));

	const prevDate = createMemo(() => (props.prevId ? extractTimeStamp(props.prevId) : new Date(0)));
	const isNextDay = createMemo(
		() => (props.prevId && date().getDay() !== prevDate().getDay()) || date().valueOf() - prevDate().valueOf() > 86_400_000,
	);
	const prevAuthorId = createMemo<string | undefined>(() => props.prevId && MessageStore.getMessage(props.prevId)?.author_id);
	const isGroupStart = createMemo(() => {
		if (msg()?.type === MessageType.REPLY) return true;
		if (!props.prevId) return true;
		if (msg()?.author_id !== prevAuthorId()) return true;
		if (isNextDay()) return true;
		if (date().valueOf() - prevDate().valueOf() > 300_000) return true;
		return false;
	});

	return (
		<Show when={msg()} keyed>
			{(msg): JSX.Element => (
				<>
					<Show when={isNextDay()}>date divider or unread? {date().toLocaleDateString()}</Show>
					<div
						classList={{
							"is-group-start": isGroupStart(),
							"is-mentioned": false, // TODO
							[`message-author-${msg.author_id}`]: true,
							message: true,
							[`message-type-${msg.type}`]: true,
							"message-compact": isCompact(),
							"message-cozy": !isCompact(),
							[`message-state-${state()}`]: true,
						}}
						use:HoverAnimationDirective
					>
						<Switch fallback={`This messagetype hasnt been implemented yet. type=${msg.type}`}>
							<Match when={msg.type === MessageType.DEFAULT || msg.type === MessageType.REPLY}>
								<Show when={msg.type === MessageType.REPLY}>
									<Reply guildId={props.guildId} id={msg.message_reference!} />
								</Show>
								<div class="message-container">
									<div class="message-aside">
										<Show when={!isCompact() && isGroupStart()} fallback={date().toLocaleDateString()}>
											<Avatar
												size={32}
												userId={msg.author_id}
												guildId={props.guildId === "@me" ? undefined : props.guildId}
												showStatus={ShowStatus.NEVER}
											/>
										</Show>
									</div>
									<div class="message-main">
										<Show
											when={!isCompact()}
											fallback={
												<>
													<Show when={showAvatarsInCompact()}>
														<Avatar
															size={16}
															userId={msg.author_id}
															guildId={props.guildId === "@me" ? undefined : props.guildId}
															showStatus={ShowStatus.NEVER}
														/>
													</Show>
													<UserName guildId={props.guildId!} id={msg.author_id} />
												</>
											}
										>
											<Show when={isGroupStart()}>
												<div class="message-header">
													<UserName guildId={props.guildId!} id={msg.author_id} />
													{date().toLocaleTimeString()}
												</div>
											</Show>
										</Show>
										<Content content={msg.content} />
										<Show when={msg.attachments}>
											<div class="message-attachments">
												<For each={msg.attachments}>{(attachment): JSX.Element => Attachment(attachment)}</For>
											</div>
										</Show>
										<Show when={msg.sticker_items}>
											<div class="message-stickers">
												<For each={msg.sticker_items}>{(s): string => JSON.stringify(s)}</For>
											</div>
										</Show>
									</div>
								</div>
							</Match>
						</Switch>
					</div>
				</>
			)}
		</Show>
	);
}
