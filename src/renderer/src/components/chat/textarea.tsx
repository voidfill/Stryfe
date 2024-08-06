import { createMemo, createSignal, JSX, Show } from "solid-js";

import permissions from "@constants/permissions";

import { getGuildChannel, getPrivateChannelName } from "@stores/channels";

import { useLocationContext } from "@components/common/locationcontext";
import { usePermissionsContext } from "@components/common/permissionscontext";

import { ShadowCss } from "../common/shadowcss";
import textareacss from "./textarea.css@sheet";

export default function TextArea(): JSX.Element {
	const location = useLocationContext();
	const channelName = createMemo(() =>
		location().guildId === "@me" ? "@" + getPrivateChannelName(location().channelId) : "#" + getGuildChannel(location().channelId)?.name,
	);

	const pctx = usePermissionsContext();
	const canSendMessages = createMemo(() => pctx().can(permissions.SEND_MESSAGES)); // TODO: check if in thread and can send messages in thread

	const [content, setContent] = createSignal("");

	return (
		<ShadowCss css={textareacss}>
			<div class="textarea">
				<div class="textarea-container">
					<Show when={canSendMessages()} fallback={<span>You do not have permission to send messages in this channel.</span>}>
						<textarea
							class="textarea-input"
							contentEditable
							role="textbox"
							aria-multiline
							spellcheck
							onInput={(e): void => void setContent(e.target.textContent ?? "")}
							placeholder={`Message ${channelName()}`}
							value={content()}
						/>
					</Show>
				</div>
			</div>
		</ShadowCss>
	);
}
