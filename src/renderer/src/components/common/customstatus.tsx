import { createMemo, JSX, Show } from "solid-js";

import { ActivityTypes } from "@constants/user";

import { getActivities, getCustomStatus } from "@stores/activities";

import { BsCardText } from "solid-icons/bs";

import cssSheet from "./customstatus.css@sheet";
import Emoji from "./emoji";
import OverflowTooltip from "./overflowtooltip";
import { ShadowCss } from "./shadowcss";
import tippy from "./tooltip";

tippy;
OverflowTooltip;

export default function CustomStatus(props: { inline?: boolean; noToolTip?: boolean; userId: string }): JSX.Element {
	const status = createMemo(() => getCustomStatus(props.userId));
	const isPlaying = createMemo(() => getActivities(props.userId)?.some((a) => a.type !== ActivityTypes.CUSTOM));

	return (
		<Show when={status()}>
			{(status): JSX.Element => {
				return (
					<ShadowCss css={cssSheet}>
						<div class="custom-status">
							<Show when={status().emoji}>{(emoji): JSX.Element => <Emoji emoji={emoji()} size={14} tooltip={!props.inline} />}</Show>
							<span class="custom-status-text" use:OverflowTooltip={() => status().text}>
								{status().text}
							</span>
							<Show when={isPlaying()}>
								<BsCardText class="activity-box" size={14} />
							</Show>
						</div>
					</ShadowCss>
				);
			}}
		</Show>
	);
}
