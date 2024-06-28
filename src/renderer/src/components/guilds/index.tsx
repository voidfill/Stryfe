import { createMemo, For, JSX, Show } from "solid-js";

import { arbitrary } from "../common/usearbitrary";

import "./style.scss";

import { getGuild, getGuildIds } from "@renderer/stores/guilds";
import { preloadedSettings } from "@renderer/stores/settings";
import {
	closestCenter,
	CollisionDetector,
	createDraggable,
	createDroppable,
	DragDropProvider,
	DragDropSensors,
	Transformer,
	useDragDropContext,
} from "@thisbeyond/solid-dnd";

arbitrary;

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

function DroppablePre(props: { id: string; insideFolder: boolean }): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id + "-pre", { insideFolder: props.insideFolder });
	const [state] = useDragDropContext()!;

	const isActive = createMemo(() => {
		return droppable.isActiveDroppable;
		if (!droppable.isActiveDroppable) return false;
		if (state.active.draggable?.data?.type === "folder" && props.insideFolder) return false;
		return true;
	});

	return <div use:arbitrary={[droppable]} classList={{ ["droppable-" + props.id + "-pre"]: true, active: isActive(), "droppable-pre": true }} />;
}

function DroppablePost(props: { id: string; insideFolder: boolean }): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id + "-post", { insideFolder: props.insideFolder });
	const [state] = useDragDropContext()!;

	const isActive = createMemo(() => {
		return droppable.isActiveDroppable;
		if (!droppable.isActiveDroppable) return false;
		if (state.active.draggable?.data?.type === "folder" && props.insideFolder) return false;
		return true;
	});

	return <div use:arbitrary={[droppable]} classList={{ ["droppable-" + props.id + "-post"]: true, active: isActive(), "droppable-post": true }} />;
}

function Guild(props: { id: string }): JSX.Element {
	const guild = createMemo(() => getGuild(props.id));
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { type: "guild" });

	return (
		<Show when={guild()}>
			{(guild) => (
				<div class="guild" use:arbitrary={[draggable]}>
					{guild().name}
				</div>
			)}
		</Show>
	);
}

function Folder(props: simpleFolder): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const droppable = createDroppable(props.id, { insideFolder: true });
	// eslint-disable-next-line solid/reactivity
	const draggable = createDraggable(props.id, { type: "folder" });

	return (
		<>
			<DroppablePre id={props.id} insideFolder={false} />
			<div class="guilds-folder">
				<Show
					when={props.isFolder}
					fallback={
						<div use:arbitrary={[droppable]}>
							<Guild id={props.guilds[0]} />
						</div>
					}
				>
					<div class="folder-header" use:arbitrary={[droppable, draggable]}>
						{props.id}
					</div>
					<div>
						<For each={props.guilds}>
							{(id) => (
								<>
									<DroppablePre id={id} insideFolder={true} />
									<Guild id={id} />
								</>
							)}
						</For>
						<DroppablePost id={props.guilds[props.guilds.length - 1]} insideFolder={true} />
					</div>
				</Show>
				<div class="folder-header" />
			</div>
		</>
	);
}

// thanks example page
function ConstrainDragAxis(): JSX.Element {
	const [, { onDragStart, onDragEnd, addTransformer, removeTransformer }] = useDragDropContext()!;

	const transformer: Transformer = {
		callback: (transform) => ({ ...transform, x: 0 }),
		id: "constrain-x-axis",
		order: 100,
	};

	onDragStart(({ draggable }) => {
		addTransformer("draggables", draggable.id, transformer);
	});

	onDragEnd(({ draggable }) => {
		removeTransformer("draggables", draggable.id, transformer.id);
	});

	return <></>;
}

export default function GuildsList(): JSX.Element {
	const folders = createMemo(getSimpleGuilds, [], {
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

	const collisionDetector: CollisionDetector = (draggable, droppables, context) => {
		if (draggable.data.type === "folder") droppables = droppables.filter((d) => !d.data.insideFolder);
		return closestCenter(draggable, droppables, context);
	};

	return (
		<div class="guilds-list">
			<DragDropProvider collisionDetector={collisionDetector}>
				<DragDropSensors />
				<ConstrainDragAxis />
				<For each={folders()}>{Folder}</For>
				<DroppablePost id={folders()[folders().length - 1].id} insideFolder={false} />
			</DragDropProvider>
		</div>
	);
}
