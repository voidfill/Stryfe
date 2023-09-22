import { createSignal, JSX } from "solid-js";

import Storage from "@renderer/modules/storage";

const [showMembers, setShowMembers] = createSignal(Storage.get("showMembers", true));
export { showMembers };

export default function HeaderBar(): JSX.Element {
	return <div class="header-bar">Header Bar</div>;
}
