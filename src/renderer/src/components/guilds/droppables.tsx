import { createEffect, JSX, Show } from "solid-js";

import { arbitrary } from "@components/common/usearbitrary";

import { createDroppable, useDragDropContext } from "@thisbeyond/solid-dnd";

arbitrary;

export function DroppablePre(props: { id: string; insideFolder: boolean; parentId?: string }): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id + "-pre", { id: props.id, insideFolder: props.insideFolder, parentId: props.parentId, type: "pre" });

	return (
		<div
			use:arbitrary={[droppable]}
			classList={{ ["droppable-" + props.id + "-pre"]: true, active: droppable.isActiveDroppable, "droppable-pre": true }}
		/>
	);
}

export function DroppablePost(props: { id: string; insideFolder: boolean; parentId?: string }): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id + "-post", { id: props.id, insideFolder: props.insideFolder, parentId: props.parentId, type: "post" });
	const [, actions] = useDragDropContext()!;

	createEffect(() => {
		if (props.insideFolder && droppable.isActiveDroppable) actions?.recomputeLayouts();
	});

	return (
		<>
			<div
				use:arbitrary={[droppable]}
				classList={{
					["droppable-" + props.id + "-post"]: true,
					active: droppable.isActiveDroppable,
					"droppable-post": true,
					"inside-folder": props.insideFolder,
				}}
			/>
			<Show when={props.insideFolder && droppable.isActiveDroppable}>
				<div class="droppable-post-spacer" />
			</Show>
		</>
	);
}
