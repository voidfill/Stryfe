import { JSX, Show } from "solid-js";

import { stickerURL } from "@constants/images";
import { StickerFormatType } from "@constants/schemata/guild/sticker";

import { useAnimationContext } from "@components/common/animationcontext";
import { tippy } from "@components/common/tooltip";

tippy;

export default function Sticker(props: { format_type: number; id: string; name: string }): JSX.Element {
	const doAnimate = useAnimationContext();

	return (
		<div
			classList={{
				"message-sticker": true,
				[`sticker-id-${props.id}`]: true,
			}}
			style={{ height: "160px", width: "160px" }}
			use:tippy={{
				content: () => props.name,
			}}
		>
			<Show when={props.format_type !== StickerFormatType.LOTTIE}>
				<img
					src={stickerURL(props.id, props.format_type, 160, doAnimate())}
					alt={props.name}
					style={{ height: "100%", left: "0", "object-fit": "contain", top: "0", width: "100%" }}
				/>
			</Show>
		</div>
	);
}
