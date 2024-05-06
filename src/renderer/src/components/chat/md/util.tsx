import { JSX } from "solid-js";

export function MentionBox(props: { children: JSX.Element; onClick?: JSX.EventHandler<HTMLSpanElement, MouseEvent> }): JSX.Element {
	return (
		<span
			classList={{
				clickable: !!props.onClick,
				"mention-box": true,
			}}
			onClick={(e): void => props.onClick && props.onClick(e)}
		>
			{props.children}
		</span>
	);
}
