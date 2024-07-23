import { createMemo, FlowProps, JSX } from "solid-js";

import { HiOutlineSpeakerWave } from "solid-icons/hi";

let maskId = 0;

function mentionWidth(count: string): number {
	return (count.length - 1) * 6 + 16;
}

function Masked(
	props: FlowProps<{
		activity: boolean;
		disabled?: boolean;
		mentionCount: string;
		muted: boolean;
		streaming: boolean;
		voice: boolean;
		voiceSelf: boolean;
	}>,
): JSX.Element {
	const uniqueId = "guild-mask-" + maskId++;

	const shouldShowVoice = createMemo(() => {
		if (props.disabled) return false;
		if (props.voiceSelf) return true;
		if (props.muted) return false;

		return props.voice;
	});

	const shouldShowMentionCount = createMemo(() => !props.disabled && props.mentionCount != "0");

	return (
		<svg class="guild-mask-svg" viewBox="0 0 48">
			<mask class="guild-accessories-mask" id={uniqueId}>
				<rect x="0" y="0" width="48" height="48" fill="white" />
				<rect
					height="24"
					rx="12"
					ry="12"
					fill="black"
					width={mentionWidth(props.mentionCount) + 8}
					y={shouldShowMentionCount() ? 28 : 48}
					x={shouldShowMentionCount() ? 44 - mentionWidth(props.mentionCount) : 48}
				/>
				<rect height="24" width="24" rx="12" ry="12" fill="black" x={shouldShowVoice() ? 28 : 48} y={shouldShowVoice() ? -4 : -24} />
			</mask>
			<foreignObject style={{ mask: `url(#${uniqueId})` }} x="0" y="0" width="48" height="48">
				{props.children}
			</foreignObject>
			<foreignObject x="0" y="0" width="48" height="48">
				<div class="guild-accessories">
					<span
						class="mention-count"
						style={{
							height: "12px",
							left: (shouldShowMentionCount() ? 48 - mentionWidth(props.mentionCount) : 48) + "px",
							top: (shouldShowMentionCount() ? 32 : 52) + "px",
							width: mentionWidth(props.mentionCount) - 4 + "px",
						}}
					>
						{props.mentionCount}
					</span>
					<div
						classList={{ self: props.voiceSelf, "voice-indicator": true }}
						style={{
							left: (shouldShowVoice() ? 32 : 52) + "px",
							top: (shouldShowVoice() ? 0 : -20) + "px",
						}}
					>
						<HiOutlineSpeakerWave size={14} />
					</div>
				</div>
			</foreignObject>
		</svg>
	);
}

export function GuildAccessories(props: FlowProps<{ guildId: string }>): JSX.Element {
	return (
		<Masked activity={false} mentionCount={"0"} streaming={false} voice={false} voiceSelf={false} muted={false}>
			{props.children}
		</Masked>
	);
}

export function FolderAcccessories(props: FlowProps<{ disabled: boolean; folderId: string }>): JSX.Element {
	return (
		<Masked activity={false} mentionCount={"0"} streaming={false} voice={false} voiceSelf={false} muted={false} disabled={props.disabled}>
			{props.children}
		</Masked>
	);
}
