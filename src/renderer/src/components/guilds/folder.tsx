import { createEffect, createMemo, For, JSX, Show, useContext } from "solid-js";
import { produce } from "solid-js/store";

import { defaultFolderColor } from "@constants/guilds";

import { guildFolders, openFolders, setOpenFolders } from "@stores/guildfolders";
import { getGuild } from "@stores/guilds";

import { HoverAnimationDirective } from "@components/common/animationcontext";
import { ContextmenuDirective, Item, menuContext, Separator } from "@components/common/contextmenu";
import tippy from "@components/common/tooltip";
import { arbitrary } from "@components/common/usearbitrary";
import { FaRegularFolder } from "solid-icons/fa";

import { numberToHexColor } from "../common/colorpicker";
import { createModal } from "../common/modals";
import FolderSettingsModal from "../common/modals/foldersettings";
import { FolderAcccessories } from "./accessories";
import { DroppablePost, DroppablePre } from "./droppables";
import { GuildIcon, GuildWrapper } from "./guild";

import { createDraggable, createDroppable, useDragDropContext } from "@thisbeyond/solid-dnd";

arbitrary;
tippy;
HoverAnimationDirective;
ContextmenuDirective;

function FolderContextMenu(props: { folderId: string }): JSX.Element {
	const { parentCleanup } = useContext(menuContext);
	let closeSettingsModal: undefined | (() => void);

	parentCleanup(() => closeSettingsModal?.());

	return (
		<>
			<Item
				label="Mark as Read"
				action={() => {
					// TODO: Implement
					props.folderId;
				}}
			/>
			<Separator />
			<Item
				label="Folder Settings"
				action={() => {
					closeSettingsModal = createModal({ content: () => <FolderSettingsModal folderId={props.folderId} /> });
				}}
			/>
			<Item
				label="Close all Folders"
				action={() => {
					setOpenFolders(
						produce((p) => {
							for (const id in p) p[id] = false;
						}),
					);
				}}
			/>
		</>
	);
}

export function FolderIcon(props: { id: string; open: boolean }): JSX.Element {
	const folder = createMemo(() => guildFolders[props.id]);
	const guilds = createMemo(() => (folder()?.guildIds.map(String) ?? []).slice(0, 4));
	const tooltipContent = createMemo(() => {
		const f = folder();
		if (!f) return "";
		if (f.name) return f.name;
		const guilds = f.guildIds
			.slice(0, 4)
			.map((id) => getGuild(id)?.name)
			.filter(Boolean)
			.join(", ");
		if (f.guildIds.length <= 4) return guilds;
		return `${guilds}, and ${f.guildIds.length - 4} more`;
	});

	return (
		<div
			use:tippy={{ content: tooltipContent, props: { offset: [0, 20], placement: "right" } }}
			use:HoverAnimationDirective
			use:ContextmenuDirective={() => <FolderContextMenu folderId={props.id} />}
			classList={{ "folder-icon": true, open: props.open }}
			style={{ "--folder-color": numberToHexColor(folder().color ?? defaultFolderColor) }}
			onClick={() => setOpenFolders(props.id, !props.open)}
		>
			<div class="icon-icon" style={{ padding: "14px" }}>
				<FaRegularFolder size={20} />
			</div>
			<div class="grid-items">
				<For each={guilds()}>{(id) => <GuildIcon id={id} />}</For>
			</div>
		</div>
	);
}

export function Folder(props: { id: string }): JSX.Element {
	const folder = createMemo(() => guildFolders[props.id]);
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id, { id: props.id, insideFolder: !folder().isGuild, type: "actual" });
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { type: "folder" });
	const [, actions] = useDragDropContext()!;

	const isOpen = createMemo(() => {
		if (folder().isGuild) return false;
		if (draggable.isActiveDraggable) return false;
		return openFolders[props.id] ?? false;
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
			<div classList={{ "folder-open": isOpen(), "guilds-folder": true }}>
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
					>
						<div class="folder-header">
							<div class="indicator" />
							<Show when={!draggable.isActiveDraggable}>
								<FolderAcccessories folderId={props.id} disabled={isOpen()}>
									<FolderIcon open={isOpen()} id={props.id} />
								</FolderAcccessories>
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
