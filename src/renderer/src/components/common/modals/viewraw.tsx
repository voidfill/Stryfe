import { Accessor, For, JSX, Show } from "solid-js";

import HighlightCodeBlock from "../highlightcode";
import { GenericModal, ModalFooter, ModalHeader } from ".";

const indentLevel = 4;

// this is a bit stupid, but whatever.
// passing jsx children will render in the footer, stuff like buttons for copying the raw data.
export default function ViewRawModal(props: { [key: string]: Accessor<unknown> }): JSX.Element {
	// TODO: look into a different way to stringify any data, json.stringify doesnt do bigints, maps, etc

	return (
		<GenericModal>
			<ModalHeader title="View Raw" closeButton />
			<div>
				<For each={Object.entries(props).filter(([k]) => k !== "children")}>
					{([key, value]) => (
						<div>
							<h3>{key}</h3>
							<HighlightCodeBlock content={JSON.stringify((value as Accessor<unknown>)(), null, indentLevel)} lang={"json"} />
						</div>
					)}
				</For>
			</div>
			<Show when={props.children}>
				<ModalFooter>{props.children as any as JSX.Element}</ModalFooter>
			</Show>
		</GenericModal>
	);
}
