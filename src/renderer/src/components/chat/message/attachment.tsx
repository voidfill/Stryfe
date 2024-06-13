import { createMemo, JSX } from "solid-js";
import { InferOutput } from "valibot";

import { attachmentFlags } from "@constants/message";
import _attachment from "@constants/schemata/message/attachment";

import { hasBit } from "@stores/permissions";

import { Media } from "@components/common/media";

type attachment = InferOutput<typeof _attachment>;

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
