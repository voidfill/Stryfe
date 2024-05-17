import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";
import { boolean, fallback, Output } from "valibot";

import { MessageType } from "@constants/message";
import _attachment from "@constants/schemata/message/attachment";
import _embed from "@constants/schemata/message/embed";

import { extractTimeStamp } from "@modules/unix";

import MessageStore from "@stores/messages";
import SettingsStore from "@stores/settings";

import { HoverAnimationDirective, NoAnimationDirective, useAnimationContext } from "@components/common/animationcontext";
import Avatar, { ShowStatus } from "@components/common/avatar";
import tippy from "@components/common/tooltip";

import { useLocationContext } from "../common/locationcontext";
import UserName from "../common/username";
import { parse } from "./md";

import "./message.scss";

import { stickerURL } from "@renderer/constants/images";
import { StickerFormatType } from "@renderer/constants/schemata/guild/sticker";
import Persistent from "@renderer/stores/persistent";

NoAnimationDirective;
HoverAnimationDirective;
tippy;

type attachment = Output<typeof _attachment>;
type embed = Output<typeof _embed>;

const isCompact = createMemo(() => SettingsStore.preloadedSettings.textAndImages?.messageDisplayCompact?.value ?? false);
export const [showAvatarsInCompact, setShowAvatarsInCompact] = Persistent.registerSignal("showAvatarsInCompact", fallback(boolean(), true));

function Reply(props: { guildId?: string; id: string }): JSX.Element {
	const msg = createMemo(() => MessageStore.getMessage(props.id));
	const content = createMemo(() => msg()?.content ?? "");

	return (
		<div class="message-reply" use:NoAnimationDirective>
			<Show
				when={msg()}
				fallback={
					<>
						<div class="content">Failed to load message?</div>
					</>
				}
				keyed
			>
				{(m) => {
					const md = createMemo(() => parse(content(), { allowHeading: true, formatInline: true, inline: true, outputData: {} }));
					return (
						<>
							<div class="reply-line" />
							<Avatar size={16} userId={m.author_id} guildId={props.guildId} showStatus={ShowStatus.NEVER} />
							<UserName guildId={props.guildId} id={m.author_id} color />
							<div class="content">{md().element}</div>
						</>
					);
				}}
			</Show>
		</div>
	);
}

function Attachment(props: { attachment: attachment; spoilers: { [key: string]: boolean } }): JSX.Element {
	return (
		<div class="message-attachment">
			<Switch fallback={"imagine this is an attachment" + JSON.stringify(props)}>
				<Match when={props.attachment.content_type?.startsWith("image/")}>
					<img src={props.attachment.proxy_url} alt={props.attachment.filename} />
				</Match>
			</Switch>
		</div>
	);
}

function Embed(props: { embed: embed; spoilers: { [key: string]: boolean } }): JSX.Element {
	return (
		<div class="message-embed">
			{JSON.stringify(props.embed)} {JSON.stringify(props.spoilers)}
		</div>
	);
}

function Sticker(props: { format_type: number; id: string; name: string }): JSX.Element {
	const doAnimate = useAnimationContext();

	return (
		<div
			classList={{
				"message-sticker": true,
				[`sticker-id-${props.id}`]: true,
			}}
			style={{ height: "160px", width: "160px" }}
			use:tippy={{
				content: () => props.name,
			}}
		>
			<Show when={props.format_type !== StickerFormatType.LOTTIE}>
				<img
					src={stickerURL(props.id, props.format_type, 160, doAnimate())}
					alt={props.name}
					style={{ height: "100%", left: "0", "object-fit": "contain", top: "0", width: "100%" }}
				/>
			</Show>
		</div>
	);
}

function Divider(props: { date: Date; id: string; isNextDay: boolean; prevId?: string }): JSX.Element {
	// TODO: figure out if exactly id is unread

	return (
		<Show when={props.isNextDay || false /* ^^ */}>
			<div classList={{ "message-divider": true, unread: false }}>
				<div class="divider-line" />
				<Show when={props.isNextDay}>
					<span class="divider-date">{props.date.toDateString()}</span>
				</Show>
				<div class="divider-line" />
			</div>
		</Show>
	);
}

export default function Message(props: { id: string; prevId?: string }): JSX.Element {
	const location = useLocationContext();

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

	const content = createMemo(() => msg()?.content ?? "");

	return (
		<Show when={msg()} keyed>
			{(msg): JSX.Element => (
				<>
					<Divider isNextDay={isNextDay()} date={date()} id={props.id} prevId={props.prevId} />
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
						{((): JSX.Element => {
							// this is an iife because we need the context of hoveranimationdirective for md parsing
							// TODO: maybe maybe find a better way? doesnt matter too much all things considered
							const md = createMemo(() => parse(content(), { allowHeading: true, inline: true, outputData: {} }));

							return (
								<Switch fallback={`This messagetype hasnt been implemented yet. type=${msg.type}`}>
									<Match when={msg.type === MessageType.DEFAULT || msg.type === MessageType.REPLY}>
										<Show when={msg.type === MessageType.REPLY}>
											<Reply guildId={location().guildId} id={msg.message_reference!} />
										</Show>
										<div class="message-container">
											<div class="message-aside">
												<Show
													when={!isCompact() && isGroupStart()}
													fallback={<span class="message-date">{date().toLocaleDateString()}</span>}
												>
													<Avatar
														size={32}
														userId={msg.author_id}
														guildId={location().guildId === "@me" ? undefined : location().guildId}
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
																	guildId={location().guildId === "@me" ? undefined : location().guildId}
																	showStatus={ShowStatus.NEVER}
																/>
															</Show>
															<UserName guildId={location().guildId} id={msg.author_id} color />
														</>
													}
												>
													<Show when={isGroupStart()}>
														<div class="message-header">
															<UserName guildId={location().guildId} id={msg.author_id} color />
															{date().toLocaleTimeString()}
														</div>
													</Show>
												</Show>
												<span class="message-content">{md().element}</span>
												<Show when={msg.attachments}>
													<div class="message-attachments">
														<For each={msg.attachments}>
															{(attachment): JSX.Element => (
																<Attachment attachment={attachment} spoilers={md().outputData.spoilers ?? {}} />
															)}
														</For>
													</div>
												</Show>
												<Show when={msg.embeds}>
													<div class="message-embeds">
														<For each={msg.embeds}>
															{(e): JSX.Element => <Embed embed={e} spoilers={md().outputData.spoilers ?? {}} />}
														</For>
													</div>
												</Show>
												<Show when={msg.sticker_items}>
													<div class="message-stickers">
														<For each={msg.sticker_items}>{(s): JSX.Element => Sticker(s)}</For>
													</div>
												</Show>
											</div>
										</div>
									</Match>
								</Switch>
							);
						})()}
					</div>
				</>
			)}
		</Show>
	);
}
