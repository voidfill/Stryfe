import { useParams } from "@solidjs/router";
import { JSX } from "solid-js";

export default function Chat(): JSX.Element {
	const params = useParams();

	return <div class="chat">chat {JSON.stringify(params)}</div>;
}
