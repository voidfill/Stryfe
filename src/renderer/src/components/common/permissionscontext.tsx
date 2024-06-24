import { Accessor, createContext, createMemo, JSX, ParentProps, useContext } from "solid-js";

import Permissions from "@constants/permissions";

import { isOwner } from "@stores/guilds";
import { canIgnoreAdmin, computeBasePermissions, computeChannelOverwrites, hasBit } from "@stores/permissions";
import { getSelfId } from "@stores/users";

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
	const basePermissions = createMemo(() => computeBasePermissions(location().guildId, getSelfId()));
	const channelPermissions = createMemo(() =>
		location().channelId ? computeChannelOverwrites(basePermissions(), location().guildId, location().channelId, getSelfId()) : Permissions.NONE,
	);
	const owner = createMemo(() => isOwner(location().guildId, getSelfId()));

	const v = createMemo(() => ({
		can: (check: bigint, channelId?: string): boolean => {
			if (location().guildId === "@me" || owner() || hasBit(basePermissions(), Permissions.ADMINISTRATOR)) return true;
			if (channelId && channelId !== location().channelId)
				return canIgnoreAdmin({
					basePermissions: basePermissions(),
					channelId,
					guildId: location().guildId,
					memberId: getSelfId(),
					toCheck: check,
				});
			return hasBit(channelPermissions(), check);
		},
		channel: channelPermissions(),
		guild: basePermissions(),
	}));

	return <PermissionsContext.Provider value={v}>{props.children}</PermissionsContext.Provider>;
}
