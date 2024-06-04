import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";

import { MessageType } from "@constants/message";

import { extractTimeStamp } from "@modules/unix";

import EmbedStore from "@stores/embeds";
import MessageStore from "@stores/messages";
import SettingsStore from "@stores/settings";

import { HoverAnimationDirective, NoAnimationDirective } from "@components/common/animationcontext";
import Avatar, { ShowStatus } from "@components/common/avatar";
import { useLocationContext } from "@components/common/locationcontext";
import { parse } from "@components/common/md";
import tippy from "@components/common/tooltip";
import UserName from "@components/common/username";

import Attachment from "./attachment";
import Divider from "./divider";
import Embed from "./embed";
import Reply from "./reply";
import Sticker from "./sticker";

import "./style.scss";

import { ContextmenuDirective, ViewRaw } from "@renderer/components/common/contextmenu";
import { showAvatarsInCompact } from "@renderer/signals";

NoAnimationDirective;
HoverAnimationDirective;
tippy;
ContextmenuDirective;

const isCompact = createMemo(() => SettingsStore.preloadedSettings.textAndImages?.messageDisplayCompact?.value ?? false);

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
	const embeds = createMemo(() => EmbedStore.getEmbeds(props.id));

	return (
		<Show when={msg()}>
			{(msg): JSX.Element => (
				<>
					<Divider isNextDay={isNextDay()} date={date()} id={props.id} prevId={props.prevId} />
					<div
						classList={{
							"is-group-start": isGroupStart(),
							"is-mentioned": false, // TODO
							[`message-author-${msg().author_id}`]: true,
							message: true,
							[`message-type-${msg().type}`]: true,
							"message-compact": isCompact(),
							"message-cozy": !isCompact(),
							[`message-state-${state()}`]: true,
						}}
						use:HoverAnimationDirective
						use:ContextmenuDirective={{
							menu: () => (
								<>
									<ViewRaw Content={() => msg().content} Message={msg} />
								</>
							),
						}}
					>
						{((): JSX.Element => {
							// this is an iife because we need the context of hoveranimationdirective for md parsing
							// TODO: maybe maybe find a better way? doesnt matter too much all things considered
							const md = createMemo(() => parse(content(), { allowHeading: true, inline: true, outputData: {} }));

							return (
								<Switch fallback={`This messagetype hasnt been implemented yet. type=${msg().type}`}>
									<Match when={msg().type === MessageType.DEFAULT || msg().type === MessageType.REPLY}>
										<Show when={msg().type === MessageType.REPLY}>
											<Reply guildId={location().guildId} id={msg().message_reference!} />
										</Show>
										<div class="message-container">
											<div class="message-aside">
												<Show
													when={!isCompact() && isGroupStart()}
													fallback={<span class="message-date">{date().toLocaleDateString()}</span>}
												>
													<Avatar
														size={32}
														userId={msg().author_id}
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
																	userId={msg().author_id}
																	guildId={location().guildId === "@me" ? undefined : location().guildId}
																	showStatus={ShowStatus.NEVER}
																/>
															</Show>
															<UserName guildId={location().guildId} id={msg().author_id} color roleIcon />
														</>
													}
												>
													<Show when={isGroupStart()}>
														<div class="message-header">
															<UserName guildId={location().guildId} id={msg().author_id} color roleIcon />
															{date().toLocaleTimeString()}
														</div>
													</Show>
												</Show>
												<span class="message-content">{md().element}</span>
												<div classList={{ "message-accessories": true, [`message-accesories-${props.id}`]: true }}>
													<For each={msg().attachments ?? []}>{Attachment}</For>
													<For each={embeds() ?? []}>
														{(e): JSX.Element => <Embed embed={e} spoilers={md().outputData.spoilers ?? {}} />}
													</For>
													<For each={msg().sticker_items ?? []}>{Sticker}</For>
												</div>
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
