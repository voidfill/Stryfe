import { createEffect, createMemo, For, JSX, Show } from "solid-js";

import { FaRegularFolder } from "solid-icons/fa";

import { arbitrary } from "../common/usearbitrary";
import { DroppablePost, DroppablePre } from "./droppables";
import { GuildWrapper } from "./guild";
import { GuildIcon } from "./guild";

import { collapsedFolders, guildFolders, setCollapsedFolders } from "@renderer/stores/guildfolders";
import { createDraggable, createDroppable, useDragDropContext } from "@thisbeyond/solid-dnd";

arbitrary;

export function FolderIcon(props: { id: string; open: boolean }): JSX.Element {
	const folder = createMemo(() => guildFolders[props.id]);
	const guilds = createMemo(() => (folder()?.guildIds.map(String) ?? []).slice(0, 4));

	return (
		<div classList={{ "folder-icon": true, open: props.open }} style={{ "--folder-color": "#" + (folder().color?.toString(16) ?? "56e") }}>
			<div class="icon-icon" style={{ padding: "14px" }}>
				<FaRegularFolder size={20} />
			</div>
			<div class="grid-items">
				<For each={guilds()}>{(id) => <GuildIcon id={id} />}</For>
			</div>
		</div>
	);
}

export default function Folder(props: { id: string }): JSX.Element {
	const folder = createMemo(() => guildFolders[props.id]);
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id, { id: props.id, insideFolder: !folder().isGuild, type: "actual" });
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { type: "folder" });
	const [, actions] = useDragDropContext()!;

	const isOpen = createMemo(() => {
		if (folder().isGuild) return false;
		if (draggable.isActiveDraggable) return false;
		return collapsedFolders[props.id] ?? true;
	});

	let firstRun = true;
	createEffect(() => {
		isOpen();
		if (firstRun) return void (firstRun = false);
		requestAnimationFrame(() => actions?.recomputeLayouts());
	});

	return (
		<>
			<DroppablePre id={props.id} insideFolder={false} />
			<div class="guilds-folder">
				<Show
					when={!folder().isGuild}
					fallback={
						<div
							use:arbitrary={[droppable]}
							classList={{ "active-droppable": droppable.isActiveDroppable, "fake-folder": true, "folder-droppable": true }}
						>
							<GuildWrapper id={props.id} />
						</div>
					}
				>
					<div
						classList={{
							"active-draggable": draggable.isActiveDraggable,
							"active-droppable": droppable.isActiveDroppable,
							"folder-droppable": true,
							"folder-header-container": true,
						}}
						use:arbitrary={[droppable, draggable]}
						onClick={() => setCollapsedFolders(props.id, !isOpen())}
					>
						<div class="folder-header">
							<div class="indicator" />
							<Show when={!draggable.isActiveDraggable}>
								<FolderIcon open={isOpen()} id={props.id} />
							</Show>
						</div>
					</div>
					<Show when={isOpen()}>
						<div>
							<For each={folder().guildIds}>
								{(id) => (
									<>
										<DroppablePre id={id} insideFolder={true} parentId={props.id} />
										<GuildWrapper id={id} parentId={props.id} />
									</>
								)}
							</For>
							<DroppablePost id={folder().guildIds[folder().guildIds.length - 1]} insideFolder={true} parentId={props.id} />
						</div>
					</Show>
					<div class="folder-background" />
				</Show>
			</div>
		</>
	);
}
