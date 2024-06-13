import { createMemo, createSignal, FlowProps, getOwner, JSX, onCleanup, Show } from "solid-js";

import { deletable } from "@constants/message";
import permissions from "@constants/permissions";

import MessageStore from "@stores/messages";
import UserStore from "@stores/users";

import { createContextmenu, Item } from "@components/common/contextmenu";
import { useLocationContext } from "@components/common/locationcontext";
import { createModal } from "@components/common/modals";
import ViewRawModal from "@components/common/modals/viewraw";
import { usePermissionsContext } from "@components/common/permissionscontext";
import tippy from "@components/common/tooltip";
import { AiOutlineLink } from "solid-icons/ai";
import { BsEmojiSmile, BsThreeDots } from "solid-icons/bs";
import { FaRegularTrashCan } from "solid-icons/fa";
import { FiCode } from "solid-icons/fi";
import { OcGitbranch2, OcPencil2, OcPin2, OcReply2, OcUnread2 } from "solid-icons/oc";

tippy;

// TODO: unified context menu between this and the normal one
function contextmenu(messageId: string): JSX.Element {
	return (
		<>
			<Item label={"nya"} action={() => console.log(messageId)} />
		</>
	);
}

function Button(props: FlowProps<{ left?: (e: MouseEvent) => void; right?: (e: MouseEvent) => void; tip: string }>): JSX.Element {
	return (
		<div
			class="message-button"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				props.left?.(e);
			}}
			ref={(el) => {
				// this is terrible, why cant i do it as a property? :(
				el.addEventListener("contextmenu", (e) => {
					e.stopPropagation();
					e.preventDefault();
					props.right?.(e);
				});
			}}
			use:tippy={{ content: () => props.tip, props: { hideOnClick: false } }}
		>
			{props.children}
		</div>
	);
}

const [shift, setShift] = createSignal(false);
document.addEventListener("keydown", (e) => {
	if (e.key === "Shift") setShift(true);
});
document.addEventListener("keyup", (e) => {
	if (e.key === "Shift") setShift(false);
});

export default function Buttons(props: { messageId: string }): JSX.Element {
	const owner = getOwner();
	if (!owner) throw new Error("No owner");
	const location = useLocationContext();
	const currentPermissions = usePermissionsContext();
	const msg = createMemo(() => MessageStore.getMessage(props.messageId));
	const isAuthor = createMemo(() => msg()?.author_id === UserStore.getSelfId());
	const canDelete = createMemo(() => {
		const m = msg();
		if (!m || !deletable[m.type]) return false;
		if (isAuthor()) return true;
		if (currentPermissions().can(permissions.MANAGE_MESSAGES, location().channelId)) return true;
		return false;
	});
	const canPin = createMemo(() => msg() && currentPermissions().can(permissions.MANAGE_MESSAGES, location().channelId));
	const canCreateThread = createMemo(() => msg() && currentPermissions().can(permissions.CREATE_PUBLIC_THREADS, location().channelId));
	const canReact = createMemo(() => msg() && currentPermissions().can(permissions.ADD_REACTIONS, location().channelId));
	const canSendMessages = createMemo(() => currentPermissions().can(permissions.SEND_MESSAGES, location().channelId));

	const toDispose: (() => void)[] = [];

	onCleanup(() => {
		for (const dispose of toDispose) dispose();
	});

	const [stayOpen, setStayOpen] = createSignal(false);

	return (
		<div class="message-buttons" style={stayOpen() ? { display: "flex" } : {}}>
			<Show when={shift() && !stayOpen()}>
				<Button tip="Copy Message ID" left={() => navigator.clipboard.writeText(props.messageId)}>
					ID
				</Button>
				<Button
					tip="Copy Link"
					left={() =>
						navigator.clipboard.writeText(`https://discord.com/channels/${location().guildId}/${location().channelId}/${props.messageId}`)
					}
				>
					<AiOutlineLink size={20} />
				</Button>
				<Button tip="Mark Unread">
					<OcUnread2 size={20} />
				</Button>
				<Show when={canPin()}>
					<Button
						// TODO: unpin
						tip="Pin Message"
					>
						<OcPin2 size={20} />
					</Button>
				</Show>
				<Show when={isAuthor() && canSendMessages()}>
					<Button tip="Reply">
						<OcReply2 size={20} />
					</Button>
				</Show>
			</Show>

			<Button
				tip="View Raw"
				left={() => void toDispose.push(createModal({ content: () => <ViewRawModal Content={() => msg()?.content} Message={msg} /> }))}
				right={() => navigator.clipboard.writeText(msg()?.content ?? "")}
			>
				<FiCode size={20} />
			</Button>
			<Show when={canReact()}>
				<Button tip="Add Reaction">
					<BsEmojiSmile size={20} />
				</Button>
			</Show>
			<Show when={canCreateThread()}>
				<Button tip="Create Thread">
					<OcGitbranch2 size={20} />
				</Button>
			</Show>
			<Show when={!isAuthor() && canSendMessages()}>
				<Button tip="Reply">
					<OcReply2 size={20} />
				</Button>
			</Show>
			<Show when={isAuthor() && canSendMessages()}>
				<Button tip="Edit">
					<OcPencil2 size={20} />
				</Button>
			</Show>
			<Show
				when={shift() && canDelete() && !stayOpen()}
				fallback={
					<Button
						tip="More"
						left={(e) => {
							toDispose.push(
								createContextmenu(
									() => contextmenu(props.messageId),
									(e.currentTarget as Element).getBoundingClientRect(),
									owner,
									false,
									() => setStayOpen(false),
								),
							);
							setStayOpen(true);
						}}
					>
						<BsThreeDots size={20} />
					</Button>
				}
			>
				<Button tip="Delete">
					<FaRegularTrashCan size={20} color="red" />
				</Button>
			</Show>
		</div>
	);
}
