import { createMemo, JSX, Show } from "solid-js";

import MessageStore from "@stores/messages";

import { NoAnimationDirective } from "@components/common/animationcontext";
import Avatar, { ShowStatus } from "@components/common/avatar";
import UserName from "@components/common/username";

import { parse } from "../../common/md";

NoAnimationDirective;

export default function Reply(props: { guildId?: string; id: string }): JSX.Element {
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
			>
				{(m) => {
					const md = createMemo(() => parse(content(), { allowHeading: true, formatInline: true, inline: true, outputData: {} }));
					return (
						<>
							<div class="reply-line" />
							<Avatar size={16} userId={m().author_id} guildId={props.guildId} showStatus={ShowStatus.NEVER} />
							<UserName guildId={props.guildId} id={m().author_id} color />
							<div class="content md-format-inline">{md().element}</div>
						</>
					);
				}}
			</Show>
		</div>
	);
}
