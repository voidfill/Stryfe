import { Accessor, createEffect, createMemo, For, JSX, onMount, Show } from "solid-js";
import { unwrap } from "solid-js/store";
import { trackDeep } from "@solid-primitives/deep";

import HighlightCodeBlock from "../highlightcode";
import { GenericModal, ModalFooter, ModalHeader } from ".";

import { AnsiUp } from "ansi_up";
import { type InspectOptions } from "util";

const ansi_up = new AnsiUp();

const inspectOptions: InspectOptions = {
	colors: true,
	depth: 4,
	maxStringLength: 1000,
	numericSeparator: true,
	showHidden: true,
};

// this is a bit stupid, but whatever.
// passing jsx children will render in the footer, stuff like buttons for copying the raw data.
export default function ViewRawModal(props: { [key: string]: Accessor<unknown> }): JSX.Element {
	return (
		<GenericModal>
			<ModalHeader title="View Raw" closeButton />
			<div class="scroller scroller-auto scroller-thin" style={{ padding: "16px" }}>
				<For each={Object.entries(props).filter(([k]) => k !== "children")}>
					{([key, value]) => {
						let ref: HTMLElement | undefined;
						const str = createMemo(() => {
							const v = value();
							if (typeof v !== "object" || v === null) return window.nodeInspect(v, inspectOptions);
							trackDeep(v);
							return window.nodeInspect(unwrap(v), inspectOptions);
						});

						onMount(() => {
							createEffect(() => {
								ref!.innerHTML = ansi_up.ansi_to_html(str());
							});
						});

						return (
							<div>
								<h4>{key}</h4>
								<HighlightCodeBlock
									ref={(r) => {
										ref = r;
									}}
									content={""}
								/>
							</div>
						);
					}}
				</For>
			</div>
			<Show when={props.children}>
				<ModalFooter>{props.children as any as JSX.Element}</ModalFooter>
			</Show>
		</GenericModal>
	);
}
