import { createMemo, JSX, Show } from "solid-js";

import "./customstatus.scss";

import ActivityStore from "@renderer/stores/activities";

// TODO: Emoji component

export default function CustomStatus(props: { userId: string }): JSX.Element {
	const status = createMemo(() => ActivityStore.getCustomStatus(props.userId));

	return (
		<Show when={status()} keyed>
			{(status): JSX.Element => (
				<div class="custom-status">
					<div class="custom-status-emoji">{status?.emoji?.name}</div>
					<span class="custom-status-text">{status?.text}</span>
				</div>
			)}
		</Show>
	);
}
