import { createMemo, For, JSX, Show } from "solid-js";

import { getTyping } from "@stores/typing";
import { isFocused } from "@stores/window";

import UserName from "../common/username";

import "./typing.scss";

const maxCurrent = 5;

export default function Typing(props: { channelId: string; guildId?: string }): JSX.Element {
	const typing = createMemo(() => getTyping(props.channelId));

	return (
		<div class="typing">
			<Show when={!!typing().length}>
				<svg height="10px" width="35px" classList={{ "animation-paused": !isFocused(), "typing-indicators": true }}>
					<circle cx="5" cy="5" r="5" />
					<circle cx="17.5" cy="5" r="5" style={{ "animation-delay": "0.5s" }} />
					<circle cx="30" cy="5" r="5" style={{ "animation-delay": "1s" }} />
				</svg>
			</Show>
			<text>
				<Show when={typing().length < maxCurrent} fallback={<span>Several People</span>}>
					<For each={typing()}>
						{([id], i) => (
							<>
								<Show when={i() && i() < typing().length - 1}>
									<span>, </span>
								</Show>
								<Show when={i() && i() === typing().length - 1}>
									<span> and </span>
								</Show>
								<strong>
									<UserName id={id} guildId={props.guildId} />
								</strong>
							</>
						)}
					</For>
				</Show>
				<Show when={typing().length === 1}>
					<span> is typing...</span>
				</Show>
				<Show when={typing().length > 1}>
					<span> are typing...</span>
				</Show>
			</text>
		</div>
	);
}
