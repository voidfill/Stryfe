import { useParams } from "@solidjs/router";
import { JSX } from "solid-js";

import MessageStore from "@stores/messages";

export default function Chat(): JSX.Element {
	const params = useParams();
	const a = MessageStore.getMessage("a");

	return <div class="chat">chat {JSON.stringify(params)}</div>;
}
