import { Accessor, createContext, createMemo, JSX, ParentProps, useContext } from "solid-js";

import Permissions from "@constants/permissions";

import GuildStore from "@stores/guilds";
import PermissionsStore, { hasBit } from "@stores/permissions";
import UserStore from "@stores/users";

import { useLocationContext } from "./locationcontext";

type t = { can: (check: bigint, channelId?: string) => boolean; channel: bigint; guild: bigint };

export const PermissionsContext = createContext<Accessor<t>>(() => ({
	can: (): boolean => false,
	channel: Permissions.NONE,
	guild: Permissions.NONE,
}));
export const usePermissionsContext = (): Accessor<t> => useContext(PermissionsContext);

export function CurrentPermissionProvider(props: ParentProps): JSX.Element {
	const location = useLocationContext();
	const selfId = createMemo(() => UserStore.getSelfId());
	const basePermissions = createMemo(() => (selfId() ? PermissionsStore.computeBasePermissions(location().guildId, selfId()!) : Permissions.NONE));
	const channelPermissions = createMemo(() =>
		selfId() && location().channelId
			? PermissionsStore.computeChannelOverwrites(basePermissions(), location().guildId, location().channelId, selfId()!)
			: Permissions.NONE,
	);
	const isOwner = createMemo<boolean>(() => (selfId() && GuildStore.getGuild(location().guildId)?.owner_id === selfId()) || false);

	const v = createMemo(() => ({
		can: (check: bigint, channelId?: string): boolean => {
			if (isOwner() || hasBit(basePermissions(), Permissions.ADMINISTRATOR)) return true;
			if (channelId && channelId !== location().channelId)
				return PermissionsStore.canIgnoreAdmin({
					basePermissions: basePermissions(),
					channelId,
					guildId: location().guildId,
					memberId: selfId()!,
					toCheck: check,
				});
			return hasBit(channelPermissions(), check);
		},
		channel: channelPermissions(),
		guild: basePermissions(),
	}));

	return <PermissionsContext.Provider value={v}>{props.children}</PermissionsContext.Provider>;
}
