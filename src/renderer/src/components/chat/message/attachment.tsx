import { createMemo, JSX } from "solid-js";
import { Output } from "valibot";

import _attachment from "@constants/schemata/message/attachment";

import { Media } from "@renderer/components/common/media";
import { attachmentFlags } from "@renderer/constants/message";
import { hasBit } from "@renderer/stores/permissions";

type attachment = Output<typeof _attachment>;

export default function Attachment(props: attachment): JSX.Element {
	const isClip = createMemo(() => hasBit(props.flags ?? 0, attachmentFlags.IS_CLIP));
	const isThumbnail = createMemo(() => hasBit(props.flags ?? 0, attachmentFlags.IS_THUMBNAIL));
	const isRemix = createMemo(() => hasBit(props.flags ?? 0, attachmentFlags.IS_REMIX));
	const isSpoiler = createMemo(() => hasBit(props.flags ?? 0, attachmentFlags.IS_SPOILER));
	const isExplicit = createMemo(() => hasBit(props.flags ?? 0, attachmentFlags.CONTAINS_EXPLICIT_MEDIA));

	return (
		<Media {...props} is_clip={isClip()} is_thumbnail={isThumbnail()} is_remix={isRemix()} is_spoiler={isSpoiler()} is_explicit={isExplicit()} />
	);
}
