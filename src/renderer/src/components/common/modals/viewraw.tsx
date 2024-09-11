import { Accessor, createMemo, For, JSX, Show } from "solid-js";
import { unwrap } from "solid-js/store";
import { trackDeep } from "@solid-primitives/deep";

import HighlightCodeBlock from "../highlightcode";
import { GenericModal, ModalFooter, ModalHeader } from ".";

import { type InspectOptions } from "util";

const inspectOptions: InspectOptions = {
	colors: true,
	depth: 4,
	maxStringLength: 400,
	numericSeparator: true,
	showHidden: true,
};

// this is a bit stupid, but whatever.
// passing jsx children will render in the footer, stuff like buttons for copying the raw data.
export default function ViewRawModal(props: { [key: string]: Accessor<unknown> }): JSX.Element {
	return (
		<GenericModal>
			<ModalHeader title="View Raw" closeButton />
			<div class="scroll scroll-auto scroll-thin" style={{ padding: "16px", "padding-top": "0px" }}>
				<For each={Object.entries(props).filter(([k]) => k !== "children")}>
					{([key, value]) => {
						const str = createMemo(() => {
							const v = value();
							if (typeof v !== "object" || v === null)
								return window.nodeInspect(v, { ...inspectOptions, compact: true, maxStringLength: 10_000 });
							trackDeep(v);
							return window.nodeInspect(unwrap(v), inspectOptions);
						});

						return (
							<div>
								<h4>{key}</h4>
								<HighlightCodeBlock content={str()} lang="ansi" />
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
