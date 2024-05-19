import { JSX, Show } from "solid-js";

export default function Divider(props: { date: Date; id: string; isNextDay: boolean; prevId?: string }): JSX.Element {
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
