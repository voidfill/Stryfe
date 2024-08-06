import { createMemo, For, JSX, Show } from "solid-js";
import { produce } from "solid-js/store";

import {
	addToFolder,
	guildFolders,
	openFolders,
	orderedFolderIds,
	removeFromFolder,
	setGuildFolders,
	setOrderedFolderIds,
} from "@stores/guildfolders";

import { arbitrary } from "@components/common/usearbitrary";
import { OcStack3 } from "solid-icons/oc";

import { DroppablePost } from "./droppables";
import { Folder, FolderIcon } from "./folder";
import { GuildIcon } from "./guild";

import "./style.scss";

import { lastSelectedChannels } from "@renderer/signals";
import {
	closestCenter,
	CollisionDetector,
	DragDropProvider,
	DragDropSensors,
	DragEventHandler,
	DragOverlay,
	Transformer,
	useDragDropContext,
} from "@thisbeyond/solid-dnd";

arbitrary;

type DragDropContext = ReturnType<typeof useDragDropContext> extends infer R | null ? R : never;
type DragDropActions = DragDropContext[1];
type DragDropState = DragDropContext[0];

function pseudoRandomId(): number {
	return 2 ** 32 * Math.random();
}

export default function GuildsList(): JSX.Element {
	let scrollRef: HTMLDivElement | undefined;
	let actions: DragDropActions | undefined;
	let state: DragDropState | undefined;

	const collisionDetector: CollisionDetector = (draggable, droppables, context) => {
		if (draggable.data.type === "folder") droppables = droppables.filter((d) => !d.data.insideFolder && d.data.type !== "actual");
		if (draggable.data.type === "guild") droppables = droppables.filter((d) => d.id !== draggable.id);
		return closestCenter(draggable, droppables, context);
	};

	const constrainXAxis: Transformer = {
		callback: (transform) => {
			return { x: 0, y: transform.y };
		},
		id: "constrain-x-axis",
		order: 100,
	};

	let interval: NodeJS.Timeout | undefined;

	function onMouseMove(): void {
		const cur = state?.active.overlay?.transformed;
		if (!cur || !scrollRef) return;
		const r = scrollRef.getBoundingClientRect();

		if (cur.y < -48 || cur.y > r.y + r.height + 48) {
			if (interval) interval = void clearInterval(interval);
			return;
		}

		if (cur.y < cur.height && scrollRef.scrollTop > 0) {
			if (interval) interval = void clearInterval(interval);
			const f = (): void => {
				scrollRef.scrollTo({ top: scrollRef.scrollTop - 1 });
				requestAnimationFrame(() => actions?.recomputeLayouts());
			};
			interval = setInterval(f, 50 / (cur.height / Math.max(cur.y, 0)));
			f();
			return;
		}

		if (cur.y > r.y + r.height - cur.height && scrollRef.scrollTop < scrollRef.scrollHeight - r.height) {
			if (interval) interval = void clearInterval(interval);
			const f = (): void => {
				scrollRef.scrollTo({ top: scrollRef.scrollTop + 1 });
				requestAnimationFrame(() => actions?.recomputeLayouts());
			};
			interval = setInterval(f, 50 / (cur.height / Math.max(r.y + r.height - cur.y - cur.height, 0)));
			f();
			return;
		}

		if (interval) interval = void clearInterval(interval);
	}

	const onDragStart: DragEventHandler = (event) => {
		actions?.addTransformer("draggables", event.draggable.id, constrainXAxis);
		document.addEventListener("mousemove", onMouseMove);
	};

	const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
		actions?.removeTransformer("draggables", draggable.id, constrainXAxis.id);
		document.removeEventListener("mousemove", onMouseMove);
		if (interval) interval = void clearInterval(interval);
		if (!draggable || !droppable) return;

		if (draggable.id === droppable.data.id) return;

		if (draggable.data.type == "folder") {
			const oldPos = orderedFolderIds.indexOf(String(draggable.id));
			if (oldPos === -1) return;

			let newPos = -1;
			if (droppable.data.type === "pre") newPos = orderedFolderIds.indexOf(String(droppable.data.id));
			else if (droppable.data.type === "post") newPos = orderedFolderIds.length;

			if (newPos === -1) return;

			if (oldPos < newPos) newPos--;
			const newOrdered = orderedFolderIds.filter((i) => i !== draggable.id);
			newOrdered.splice(newPos, 0, String(draggable.id));
			return void setOrderedFolderIds(newOrdered);
		}

		if (droppable.data.type === "actual") {
			if (!orderedFolderIds.includes(droppable.data.id) || !guildFolders[droppable.data.id]) return;
			if (droppable.data.id === draggable.data.parentId) {
				const srcFolder = guildFolders[droppable.data.id];
				if (srcFolder.guildIds.length === 1) return;
				const oldPos = srcFolder.guildIds.indexOf(draggable.data.id);
				if (oldPos === -1 || oldPos === srcFolder.guildIds.length - 1) return;
			}

			removeFromFolder(draggable.data.parentId || draggable.data.id, draggable.data.id);

			if (droppable.data.insideFolder) return void addToFolder(droppable.data.id, draggable.data.id);

			let _newFid = pseudoRandomId();
			while (guildFolders[_newFid]) _newFid = pseudoRandomId();
			const newFid = String(_newFid);

			const i = orderedFolderIds.indexOf(droppable.data.id);
			setGuildFolders(newFid, { guildIds: [droppable.data.id, draggable.data.id] });
			return void setOrderedFolderIds(
				produce((p) => {
					p.splice(i, 1, newFid);
				}),
			);
		}

		if (droppable.data.insideFolder) {
			const destFolder = guildFolders[droppable.data.parentId];
			const sourceFolder = guildFolders[draggable.data.parentId];
			if (!destFolder || !sourceFolder || !sourceFolder.guildIds.includes(draggable.data.id)) return;

			if (droppable.data.type === "post") {
				removeFromFolder(draggable.data.parentId, draggable.data.id);
				addToFolder(droppable.data.parentId, draggable.data.id);
			} else {
				removeFromFolder(draggable.data.parentId, draggable.data.id);
				const i = sourceFolder.guildIds.indexOf(droppable.data.id);
				addToFolder(droppable.data.parentId, draggable.data.id, i);
			}
			return;
		}

		if (droppable.data.insideFolder === false) {
			if (!guildFolders[draggable.data.parentId || draggable.data.id]?.guildIds.includes(draggable.data.id)) return;
			const beforeRemove = [...orderedFolderIds];
			removeFromFolder(draggable.data.parentId || draggable.data.id, draggable.data.id);

			let newPos = -1;
			if (droppable.data.type === "pre") {
				newPos = orderedFolderIds.indexOf(droppable.data.parentId || droppable.data.id);
				if (newPos === -1) newPos = beforeRemove.indexOf(droppable.data.parentId || droppable.data.id);
			} else if (droppable.data.type === "post") {
				newPos = orderedFolderIds.length;
			}

			setGuildFolders(draggable.data.id, { guildIds: [draggable.data.id], isGuild: true });
			setOrderedFolderIds(
				produce((p) => {
					p.splice(newPos, 0, draggable.data.id);
				}),
			);
		}
	};

	const activeDragId = (): string | undefined => state?.active.draggableId?.toString() ?? undefined;

	return (
		<div ref={scrollRef} class="guilds-list">
			<a class="home-button" href={`/channels/@me/${lastSelectedChannels["@me"] ?? ""}`}>
				<div class="indicator" />
				<OcStack3 size={40} />
			</a>
			<div class="divider" />
			<DragDropProvider collisionDetector={collisionDetector} onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{((): JSX.Element => {
					[state, actions] = useDragDropContext()!;
					return <></>;
				})()}
				<DragDropSensors />
				<For each={orderedFolderIds}>{(id) => <Folder id={id} />}</For>
				<Show when={orderedFolderIds[orderedFolderIds.length - 1]}>
					{(id): JSX.Element => <DroppablePost id={id()} insideFolder={false} />}
				</Show>
				<DragOverlay>
					<div class="drag-overlay">
						<Show when={state.active.draggable?.data.type === "guild"}>
							<GuildIcon id={activeDragId()!} />
						</Show>
						<Show when={state.active.draggable?.data.type === "folder"}>
							{((): JSX.Element => {
								const open = createMemo(() => openFolders[activeDragId()!] ?? false);

								return <FolderIcon id={activeDragId()!} open={open()} />;
							})()}
						</Show>
					</div>
				</DragOverlay>
			</DragDropProvider>
		</div>
	);
}
