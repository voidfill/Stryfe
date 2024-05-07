import { Accessor, createContext, createMemo, JSX, ParentProps, useContext } from "solid-js";

import Permissions from "@constants/permissions";

import PermissionsStore from "@stores/permissions";
import UserStore from "@stores/users";

import { useLocationContext } from "./locationcontext";

export const PermissionsContext = createContext<() => { channel: bigint; guild: bigint }>(() => ({
	channel: Permissions.NONE,
	guild: Permissions.NONE,
}));
export const usePermissionsContext = (): Accessor<{ channel: bigint; guild: bigint }> => useContext(PermissionsContext);

export function CurrentPermissionProvider(props: ParentProps): JSX.Element {
	const location = useLocationContext();
	const selfId = createMemo(() => UserStore.getSelfId());
	const basePermissions = createMemo(() => (selfId() ? PermissionsStore.computeBasePermissions(location().guildId, selfId()!) : Permissions.NONE));
	const channelPermissions = createMemo(() =>
		selfId()
			? PermissionsStore.computeChannelOverwrites(basePermissions(), location().guildId, location().channelId, selfId()!)
			: Permissions.NONE,
	);
	const v = createMemo(() => ({
		channel: channelPermissions(),
		guild: basePermissions(),
	}));

	return <PermissionsContext.Provider value={v}>{props.children}</PermissionsContext.Provider>;
}
