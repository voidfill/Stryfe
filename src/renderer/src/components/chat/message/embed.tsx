import { JSX } from "solid-js";
import { Output } from "valibot";

import _embed from "@constants/schemata/message/embed";

type embed = Output<typeof _embed>;

export default function Embed(props: { embed: embed; spoilers: { [key: string]: boolean } }): JSX.Element {
	return (
		<div class="message-embed">
			{JSON.stringify(props.embed)} {JSON.stringify(props.spoilers)}
		</div>
	);
}
