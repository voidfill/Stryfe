import { createSelector, For, JSX, Show } from "solid-js";

import { AiOutlineCheck } from "solid-icons/ai";
import { CgColorPicker } from "solid-icons/cg";

import tippy from "./tooltip";

import "./colorpicker.scss";

const presetColors: string[] = [
	"#1abc9c",
	"#2ecc71",
	"#3498db",
	"#9b59b6",
	"#e91e63",
	"#f1c40f",
	"#e67e22",
	"#e74c3c",
	"#95a5a6",
	"#607d8b",
	//
	"#11806a",
	"#1f8b4c",
	"#206694",
	"#71368a",
	"#ad1457",
	"#c27c0e",
	"#a84300",
	"#992d22",
	"#979c9f",
	"#546e7a",
];
const presetSet = new Set(presetColors);

tippy;

export default function ColorPicker(props: { default: string; setValue: (n: string) => void; value: string | undefined }): JSX.Element {
	const sel = createSelector(() => props.value);

	return (
		<div class="color-picker">
			<button
				class="default-color"
				style={{ "background-color": props.default }}
				onClick={() => props.setValue(props.default)}
				use:tippy={() => "Default"}
			>
				<Show when={props.value === undefined || sel(props.default)}>
					<AiOutlineCheck size={24} />
				</Show>
			</button>
			<div class="input-wrapper" use:tippy={() => "Custom Color"}>
				<input class="input" type="color" value={props.value} onChange={(v) => props.setValue(v.target.value)} />
				<Show when={props.value !== props.default && !presetSet.has(props.value!)}>
					<AiOutlineCheck size={24} />
				</Show>
				<CgColorPicker class="picker-icon" size={16} />
			</div>
			<div class="presets">
				<For each={presetColors}>
					{(color) => (
						<button class="preset-color" style={{ "background-color": color }} onClick={() => props.setValue(color)}>
							<Show when={sel(color)}>
								<AiOutlineCheck size={18} />
							</Show>
						</button>
					)}
				</For>
			</div>
		</div>
	);
}

export function numberToHexColor(num: number): string {
	return "#" + num.toString(16).padStart(6, "0");
}

export function hexColorToNumber(hex: string): number {
	return parseInt(hex.slice(1), 16);
}
