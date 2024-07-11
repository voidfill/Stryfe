import { useNavigate, useParams } from "@solidjs/router";
import { Accessor, createEffect, createMemo, For, JSX, Show } from "solid-js";
import { createStore, produce, unwrap } from "solid-js/store";
import { boolean, fallback, record, string } from "valibot";

import { FaRegularFolder } from "solid-icons/fa";

import { arbitrary } from "../common/usearbitrary";

import "./style.scss";

import { persistStore } from "@renderer/modules/persist";
import { lastSelectedChannels } from "@renderer/signals";
import { getAcronym, getGuild, getGuildIds, getIconUrl } from "@renderer/stores/guilds";
import { preloadedSettings } from "@renderer/stores/settings";
import {
	closestCenter,
	CollisionDetector,
	createDraggable,
	createDroppable,
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

const [collapsed, setCollapsed] = persistStore("collapsedFolders", fallback(record(string(), boolean()), {}));

type simpleFolder =
	| {
			guilds: string[];
			id: string;
			isFolder: true;
	  }
	| {
			guilds: [string];
			id: string;
			isFolder: false;
	  };

function getSimpleGuilds(): simpleFolder[] {
	const all = new Set(getGuildIds());
	const folders = preloadedSettings.guildFolders?.folders ?? [];

	const out: simpleFolder[] = [];
	for (const f of folders) {
		for (const id of f.guildIds) all.delete(String(id));
		if (f.id) out.push({ guilds: f.guildIds.map(String), id: String(f.id.value), isFolder: true });
		else out.push({ guilds: [String(f.guildIds[0])], id: String(f.guildIds[0]), isFolder: false });
	}

	const rest = [...all].sort((a, b) => {
		const aa = getGuild(a),
			bb = getGuild(b);
		if (!aa || !bb) return 0;
		return new Date(aa.joined_at).valueOf() - new Date(bb.joined_at).valueOf();
	});

	return [...rest.map((id) => ({ guilds: [id] as [string], id, isFolder: false })), ...out];
}

function DroppablePre(props: { id: string; insideFolder: boolean; parentId?: string }): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id + "-pre", { id: props.id, insideFolder: props.insideFolder, parentId: props.parentId, type: "pre" });

	return (
		<div
			use:arbitrary={[droppable]}
			classList={{ ["droppable-" + props.id + "-pre"]: true, active: droppable.isActiveDroppable, "droppable-pre": true }}
		/>
	);
}

function DroppablePost(props: { id: string; insideFolder: boolean; parentId?: string }): JSX.Element {
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

function GuildIcon(props: { id: string }): JSX.Element {
	const guild = createMemo(() => getGuild(props.id));

	return (
		<Show when={guild()}>
			{(guild) => (
				<Show when={guild().icon} fallback={<div class="icon guild-acronym">{getAcronym(props.id)}</div>}>
					<img class="icon" src={getIconUrl(props.id, 48)} draggable={false} />
				</Show>
			)}
		</Show>
	);
}

function GuildWrapper(props: { id: string; parentId?: string }): JSX.Element {
	const nav = useNavigate();
	const params = useParams();

	const guild = createMemo(() => getGuild(props.id));
	const isSelected = createMemo(() => params.guildId === props.id);
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { parentId: props.parentId, type: "guild" });

	return (
		<Show when={guild()}>
			{(guild) => (
				<div classList={{ "active-draggable": draggable?.isActiveDraggable, guild: true, selected: isSelected() }}>
					<div class="indicator" />
					<div
						classList={{ acronym: !guild().icon, "icon-container": true }}
						onClick={() => nav(`/channels/${props.id}/${lastSelectedChannels[props.id] ?? ""}`)}
						use:arbitrary={[draggable]}
					>
						<Show when={!draggable.isActiveDraggable}>
							<GuildIcon id={props.id} />
						</Show>
					</div>
				</div>
			)}
		</Show>
	);
}

function FolderIcon(props: { id: string; open: boolean }): JSX.Element {
	const folderSettings = createMemo(() => preloadedSettings.guildFolders?.folders?.find((f) => String(f.id?.value) === props.id));
	const color = createMemo(() => {
		const f = folderSettings();
		if (!f) return;
		return f.color?.value;
	});
	const guilds = createMemo(() => (folderSettings()?.guildIds.map(String) ?? []).slice(0, 4));

	return (
		<div classList={{ "folder-icon": true, open: props.open }} style={{ "--folder-color": "#" + (color()?.toString(16) ?? "56e") }}>
			<div class="icon-icon" style={{ padding: "14px" }}>
				<FaRegularFolder size={20} />
			</div>
			<div class="grid-items">
				<For each={guilds()}>{(id) => <GuildIcon id={id} />}</For>
			</div>
		</div>
	);
}

function Folder(props: simpleFolder): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id, { id: props.id, insideFolder: props.isFolder, type: "actual" });
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { type: "folder" });
	const [, actions] = useDragDropContext()!;

	const isOpen = createMemo(() => {
		if (!props.isFolder) return false;
		if (draggable.isActiveDraggable) return false;
		return collapsed[props.id] ?? true;
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
					when={props.isFolder}
					fallback={
						<div
							use:arbitrary={[droppable]}
							classList={{ "active-droppable": droppable.isActiveDroppable, "fake-folder": true, "folder-droppable": true }}
						>
							<GuildWrapper id={props.guilds[0]} />
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
						onClick={() => setCollapsed(props.id, (p) => !p)}
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
							<For each={props.guilds}>
								{(id) => (
									<>
										<DroppablePre id={id} insideFolder={true} parentId={props.id} />
										<GuildWrapper id={id} parentId={props.id} />
									</>
								)}
							</For>
							<DroppablePost id={props.guilds[props.guilds.length - 1]} insideFolder={true} parentId={props.id} />
						</div>
					</Show>
					<div class="folder-background" />
				</Show>
			</div>
		</>
	);
}

function pseudoRandomId(): number {
	return 2 ** 32 * Math.random();
}

export default function GuildsList(): JSX.Element {
	let scrollRef: HTMLDivElement | undefined;
	let actions: DragDropActions | undefined;
	let state: DragDropState | undefined;

	const _folders = createMemo(getSimpleGuilds, [], {
		equals: (a, b) => {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (a[i].id !== b[i].id) return false;
				if (a[i].guilds.length !== b[i].guilds.length) return false;
				for (let j = 0; j < a[i].guilds.length; j++) {
					if (a[i].guilds[j] !== b[i].guilds[j]) return false;
				}
			}
			return true;
		},
	});

	// eslint-disable-next-line solid/reactivity
	const [folders, setFolders] = createStore(_folders());
	createEffect(() => {
		setFolders(_folders());
	});

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

		if (draggable.data.type === "folder") {
			const oldPos = folders.findIndex((f) => f.id === draggable.id);
			if (oldPos === -1) return;

			let newPos = -1;
			if (droppable.data.type === "pre") {
				newPos = folders.findIndex((f) => f.id === droppable.data.id);
			} else if (droppable.data.type === "post") {
				newPos = folders.length; // droppable post that fits folder draggable is only the very last one
			}
			if (newPos === -1) return;

			if (oldPos < newPos) newPos--;
			const newf = folders.filter((f) => f.id !== draggable.id);
			newf.splice(newPos, 0, folders[oldPos]);
			return void setFolders(newf);
		}

		const newFolders: simpleFolder[] = folders
			.map((f) => ({ ...f, guilds: f.guilds.filter((g) => g !== draggable.id) }) as simpleFolder)
			.filter((f) => f.guilds.length);

		if (droppable.data.type === "actual") {
			const i = newFolders.findIndex((f) => f.id === droppable.data.id);
			if (i === -1) return;
			const f = newFolders[i];
			if (droppable.data.insideFolder) {
				f.guilds.push(String(draggable.id));
			} else {
				let fid =
					folders.reduce((acc, cur) => {
						if (cur.isFolder && Number(cur.id) > acc) return Number(cur.id);
						return acc;
					}, 0) + 1;
				while (!fid) fid = pseudoRandomId();

				const newFolder: simpleFolder = {
					guilds: [String(droppable.data.id), String(draggable.id)],
					id: String(fid),
					isFolder: true,
				};
				newFolders.splice(i, 1, newFolder);
			}
			return void setFolders(newFolders);
		}

		if (droppable.data.insideFolder) {
			const f = newFolders.find((f) => f.id === droppable.data.parentId);
			if (!f) return;
			if (droppable.data.type === "post") {
				f.guilds.push(String(draggable.id));
			} else {
				const i = f.guilds.indexOf(String(droppable.data.id));
				if (i === -1) return;
				f.guilds.splice(i, 0, String(draggable.id));
			}
			return void setFolders(newFolders);
		}

		if (droppable.data.insideFolder === false) {
			let newPos = -1;
			if (droppable.data.type === "pre") {
				newPos = newFolders.findIndex((f) => f.id === droppable.data.id);
				if (newPos === -1) newPos = folders.findIndex((f) => f.id === droppable.data.id);
			} else if (droppable.data.type === "post") {
				newPos = newFolders.length; // we are outside of folders
			}
			console.log(draggable, droppable);
			if (newPos === -1) return;

			newFolders.splice(newPos, 0, { guilds: [String(draggable.id)], id: String(draggable.id), isFolder: false });
			return void setFolders(newFolders);
		}
	};

	const activeDragId = (): string | undefined => state?.active.draggableId?.toString() ?? undefined;

	createEffect(() => {
		console.log(JSON.parse(JSON.stringify(folders)));
	});

	return (
		<div ref={scrollRef} class="guilds-list">
			<DragDropProvider collisionDetector={collisionDetector} onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{((): JSX.Element => {
					[state, actions] = useDragDropContext()!;
					return <></>;
				})()}
				<DragDropSensors />
				<For each={folders}>{Folder}</For>
				<Show when={folders[folders.length - 1]}>{(f): JSX.Element => <DroppablePost id={f().id} insideFolder={false} />}</Show>
				<DragOverlay>
					<div class="drag-overlay">
						<Show when={state.active.draggable?.data.type === "guild"}>
							<GuildIcon id={activeDragId()!} />
						</Show>
						<Show when={state.active.draggable?.data.type === "folder"}>
							{((): JSX.Element => {
								const open = createMemo(() => collapsed[activeDragId()!] ?? false);

								return <FolderIcon id={activeDragId()!} open={open()} />;
							})()}
						</Show>
					</div>
				</DragOverlay>
			</DragDropProvider>
		</div>
	);
}
