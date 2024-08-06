import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, JSX, Match, Show, Switch, untrack } from "solid-js";

import { RelationshipTypes } from "@constants/user";

import { getActivities } from "@stores/activities";
import { getDMForUser } from "@stores/channels";
import { getBlocked, getFriends, getPending, getRelationship } from "@stores/relationships";
import { getStatus, Status, statusToText } from "@stores/status";
import { getUser } from "@stores/users";

import { BsThreeDots } from "solid-icons/bs";
import { FaSolidCheck, FaSolidMagnifyingGlass, FaSolidXmark } from "solid-icons/fa";
import { IoChatbubbleEllipsesSharp } from "solid-icons/io";

import { HoverAnimationDirective } from "../common/animationcontext";
import Avatar, { ShowStatus } from "../common/avatar";
import { Colors, ContextmenuDirective, Item } from "../common/contextmenu";
import CustomStatus from "../common/customstatus";
import { ShadowCss } from "../common/shadowcss";
import tippy from "../common/tooltip";
import friendsviewcss from "./friendsview.css@sheet";

import { friendsTab, FriendsTabs } from "@renderer/signals";

HoverAnimationDirective;
tippy;
ContextmenuDirective;

function AddFriend(): JSX.Element {
	return <div>Add Friend</div>;
}

const filter = createMemo((): (() => string[]) => {
	switch (friendsTab()) {
		case FriendsTabs.ONLINE:
			return () => getFriends().filter((id) => getStatus(id) !== Status.OFFLINE);
		case FriendsTabs.ALL:
			return () => getFriends();
		case FriendsTabs.PENDING:
			return () => getPending();
		case FriendsTabs.BLOCKED:
			return () => getBlocked();
		default:
			return () => [];
	}
});
const [search, setSearch] = createSignal<string>("");
const lower = createMemo(() => search().toLocaleLowerCase());

function FriendItem(props: { id: string }): JSX.Element {
	const navigate = useNavigate();
	const user = createMemo(() => getUser(props.id));
	const relationship = createMemo(() => getRelationship(props.id));
	const hasActivity = createMemo(() => (getActivities(props.id)?.length ?? 0) > 0);
	const statusText = createMemo(() => statusToText(getStatus(props.id)));

	return (
		<Show when={(user()?.display_name?.toLowerCase().includes(lower()) || user().username?.toLowerCase().includes(lower())) && user()}>
			{(user): JSX.Element => {
				return (
					<div
						use:HoverAnimationDirective
						use:ContextmenuDirective={() => (
							<>
								<Item label="TODO: menu" />
							</>
						)}
						class="friend-item"
						onClick={(): void => {
							const id = untrack((): string | undefined => getDMForUser(props.id));
							switch (friendsTab()) {
								case FriendsTabs.ONLINE:
								case FriendsTabs.ALL:
									if (!id) return; // TODO: create dm, transition to it
									return void navigate(`/channels/@me/${id}?jump=true`);
								case FriendsTabs.PENDING:
								case FriendsTabs.BLOCKED:
									return; // open pfp
							}
						}}
					>
						<Avatar userId={props.id} size={32} showStatus={ShowStatus.ALWAYS} />
						<div class="friend-info">
							<div class="username">
								<span class="friend-global-name">{user().display_name || user().username}</span>
								<span class="friend-username">
									{user().display_name || user().discriminator === "0" ? user().username : "#" + user().discriminator}
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
									<button use:tippy={{ content: () => "Message" }} class="friend-button">
										<IoChatbubbleEllipsesSharp size={20} />
									</button>
									<button
										use:ContextmenuDirective={{
											menu: () => <Item label="Remove Friend" color={Colors.RED} />,
											on: "click",
										}}
										use:tippy={{ content: () => "More" }}
										class="friend-button"
									>
										<BsThreeDots size={20} />
									</button>
								</Match>
								<Match when={friendsTab() === FriendsTabs.PENDING}>
									<Show
										when={relationship()?.type === RelationshipTypes.PENDING_INCOMING}
										fallback={
											<button use:tippy={{ content: () => "Cancel" }} class="friend-button cancel">
												<FaSolidXmark size={16} />
											</button>
										}
									>
										<button use:tippy={{ content: () => "Accept" }} class="friend-button accept">
											<FaSolidCheck size={16} />
										</button>
										<button use:tippy={{ content: () => "Ignore" }} class="friend-button ignore">
											<FaSolidXmark size={16} />
										</button>
									</Show>
								</Match>
								<Match when={friendsTab() === FriendsTabs.BLOCKED}>
									<button use:tippy={{ content: () => "Unblock" }} class="friend-button unblock">
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
				const user = getUser(id);
				return [id, user?.display_name || user?.username];
			})
			.sort((a, b) => a[1].localeCompare(b[1]))
			.map((a) => a[0]),
	);

	const searchedCount = createMemo(
		() =>
			filteredIds().filter((id) => {
				const user = getUser(id);
				return user.display_name?.toLowerCase().includes(lower()) || user.username?.toLowerCase().includes(lower());
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
		<ShadowCss css={friendsviewcss}>
			<div class="friends-view">
				<Show when={friendsTab() !== FriendsTabs.ADD} fallback={<AddFriend />}>
					<Friends />
				</Show>
			</div>
		</ShadowCss>
	);
}
