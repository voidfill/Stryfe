import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, JSX, Match, Show, Switch, untrack } from "solid-js";

import ActivityStore from "@stores/activities";
import ChannelStore from "@stores/channels";
import RelationshipStore from "@stores/relationships";
import StatusStore, { Status, statusToEnglish } from "@stores/status";
import UserStore from "@stores/users";

import { BsThreeDots } from "solid-icons/bs";
import { FaSolidCheck, FaSolidMagnifyingGlass, FaSolidXmark } from "solid-icons/fa";
import { IoChatbubbleEllipsesSharp } from "solid-icons/io";

import { HoverAnimationDirective } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";
import { Colors, ContextmenuDirective } from "../common/contextmenu";
import CustomStatus from "../common/customstatus";
import TooltipDirective from "../common/tooltip";

import "./friendsview.scss";

import { RelationshipTypes } from "@renderer/constants/user";
import { friendsTab, FriendsTabs } from "@renderer/signals";

HoverAnimationDirective;
TooltipDirective;
ContextmenuDirective;

function AddFriend(): JSX.Element {
	return <div>Add Friend</div>;
}

const filter = createMemo((): (() => string[]) => {
	switch (friendsTab()) {
		case FriendsTabs.ONLINE:
			return () => RelationshipStore.getFriends().filter((id) => StatusStore.getStatus(id) !== Status.OFFLINE);
		case FriendsTabs.ALL:
			return () => RelationshipStore.getFriends();
		case FriendsTabs.PENDING:
			return () => RelationshipStore.getPending();
		case FriendsTabs.BLOCKED:
			return () => RelationshipStore.getBlocked();
		default:
			return () => [];
	}
});
const [search, setSearch] = createSignal<string>("");
const lower = createMemo(() => search().toLocaleLowerCase());

function FriendItem(props: { id: string }): JSX.Element {
	const navigate = useNavigate();
	const user = createMemo(() => UserStore.getUser(props.id));
	const relationship = createMemo(() => RelationshipStore.getRelationship(props.id));
	const hasActivity = createMemo(() => (ActivityStore.getActivities(props.id)?.length ?? 0) > 0);
	const statusText = createMemo(() => statusToEnglish(StatusStore.getStatus(props.id)));

	return (
		<Show when={(user()?.global_name?.toLowerCase().includes(lower()) || user().username?.toLowerCase().includes(lower())) && user()} keyed>
			{(user): JSX.Element => {
				return (
					<div
						use:HoverAnimationDirective
						use:ContextmenuDirective={{
							menu: () => [
								{
									action: () => void 0,
									label: "Profile",
									type: "text",
								},
								{
									action: (): void => {
										const id = untrack((): string | undefined => ChannelStore.getDMForUser(props.id));
										if (!id) return; // TODO: create dm, transition to it
										return void navigate(`/channels/@me/${id}`);
									},
									label: "Message",
									type: "text",
								},
							],
						}}
						class="friend-item"
						onClick={(): void => {
							const id = untrack((): string | undefined => ChannelStore.getDMForUser(props.id));
							switch (friendsTab()) {
								case FriendsTabs.ONLINE:
								case FriendsTabs.ALL:
									if (!id) return; // TODO: create dm, transition to it
									return void navigate(`/channels/@me/${id}`);
								case FriendsTabs.PENDING:
								case FriendsTabs.BLOCKED:
									return; // open pfp
							}
						}}
					>
						<Avatar userId={props.id} size={32} showStatus={ShowStatus.ALWAYS} />
						<div class="friend-info">
							<div class="username">
								<span class="friend-global-name">{user.global_name || user.username}</span>
								<span class="friend-username">
									{user.global_name || user.discriminator === "0" ? user.username : "#" + user.discriminator}
								</span>
							</div>
							<span class="friend-status">
								<Show
									when={friendsTab() === FriendsTabs.ONLINE || friendsTab() === FriendsTabs.ALL}
									fallback={
										<Show when={friendsTab() === FriendsTabs.PENDING} fallback={"Blocked"}>
											<Show
												when={relationship()?.type === RelationshipTypes.PENDING_INCOMING}
												fallback={"Outgoing Friend Request"}
											>
												Incoming Friend Request
											</Show>
										</Show>
									}
								>
									<Show when={hasActivity()} fallback={statusText()}>
										<CustomStatus userId={props.id} inline />
									</Show>
								</Show>
							</span>
						</div>
						<div class="friend-buttons">
							<Switch>
								<Match when={friendsTab() === FriendsTabs.ONLINE || friendsTab() === FriendsTabs.ALL}>
									<button use:TooltipDirective={{ content: () => "Message" }} class="friend-button">
										<IoChatbubbleEllipsesSharp size={20} />
									</button>
									<button
										use:ContextmenuDirective={{
											menu: () => [
												{
													action: () => void 0,
													color: Colors.RED,
													label: "Remove Friend",
													type: "text",
												},
											],
											showOn: "click",
										}}
										use:TooltipDirective={{ content: () => "More" }}
										class="friend-button"
									>
										<BsThreeDots size={20} />
									</button>
								</Match>
								<Match when={friendsTab() === FriendsTabs.PENDING}>
									<Show
										when={relationship()?.type === RelationshipTypes.PENDING_INCOMING}
										fallback={
											<button use:TooltipDirective={{ content: () => "Cancel" }} class="friend-button cancel">
												<FaSolidXmark size={16} />
											</button>
										}
									>
										<button use:TooltipDirective={{ content: () => "Accept" }} class="friend-button accept">
											<FaSolidCheck size={16} />
										</button>
										<button use:TooltipDirective={{ content: () => "Ignore" }} class="friend-button ignore">
											<FaSolidXmark size={16} />
										</button>
									</Show>
								</Match>
								<Match when={friendsTab() === FriendsTabs.BLOCKED}>
									<button use:TooltipDirective={{ content: () => "Unblock" }} class="friend-button unblock">
										<FaSolidXmark size={16} />
									</button>
								</Match>
							</Switch>
						</div>
					</div>
				);
			}}
		</Show>
	);
}

const countText = createMemo(() => {
	switch (friendsTab()) {
		case FriendsTabs.ONLINE:
			return "ONLINE";
		case FriendsTabs.ALL:
			return "ALL FRIENDS";
		case FriendsTabs.PENDING:
			return "PENDING";
		case FriendsTabs.BLOCKED:
			return "BLOCKED";
		default:
			return "";
	}
});

function Friends(): JSX.Element {
	const filteredIds = createMemo(() =>
		filter()()
			.map((id) => {
				const user = UserStore.getUser(id);
				return [id, user?.global_name || user?.username];
			})
			.sort((a, b) => a[1].localeCompare(b[1]))
			.map((a) => a[0]),
	);

	const searchedCount = createMemo(
		() =>
			filteredIds().filter((id) => {
				const user = UserStore.getUser(id);
				return user.global_name?.toLowerCase().includes(lower()) || user.username?.toLowerCase().includes(lower());
			}).length,
	);

	return (
		<>
			<div class="friends-search">
				<input
					type="text"
					placeholder="Search"
					value={search()}
					onInput={(e): void => void setSearch((e.target as HTMLInputElement).value)}
				/>
				<div class="icon-container">
					<FaSolidMagnifyingGlass
						classList={{
							search: true,
							"search-icon": true,
							visible: search() === "",
						}}
						size={24}
					/>
					<FaSolidXmark
						classList={{
							clear: true,
							"search-icon": true,
							visible: search() !== "",
						}}
						onClick={(): void => void setSearch("")}
						size={24}
					/>
				</div>
			</div>
			<span class="friends-count">{`${countText()} - ${searchedCount()}`}</span>
			<div class="friends-list scroller scroller-auto">
				<For each={filteredIds()}>{(id): JSX.Element => <FriendItem id={id} />}</For>
			</div>
		</>
	);
}

export default function FriendsView(): JSX.Element {
	return (
		<div class="friends-view">
			<Show when={friendsTab() !== FriendsTabs.ADD} fallback={<AddFriend />}>
				<Friends />
			</Show>
		</div>
	);
}
