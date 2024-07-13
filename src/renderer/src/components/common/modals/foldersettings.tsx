import { createMemo, createSignal, JSX } from "solid-js";

import { guildFolders, setGuildFolders } from "@stores/guildfolders";

import ColorPicker, { hexColorToNumber, numberToHexColor } from "@components/common/colorpicker";
import { defaultFolderColor } from "@components/guilds";

import { GenericModal, ModalBody, ModalFooter, ModalHeader, useModalContext } from ".";

export default function FolderSettingsModal(props: { folderId: string }): JSX.Element {
	const close = useModalContext();
	const settings = createMemo(() => guildFolders[props.folderId]);
	// eslint-disable-next-line solid/reactivity
	const [name, setName] = createSignal(settings().name ?? "");
	// eslint-disable-next-line solid/reactivity
	const [color, setColor] = createSignal(settings().color ?? defaultFolderColor);

	return (
		<GenericModal class="folder-settings-modal">
			<ModalHeader title="Folder Settings" closeButton />
			<ModalBody>
				<h4 style={{ "margin-top": "0" }}>Folder Name</h4>
				<input
					type="text"
					value={settings().name ?? ""}
					placeholder="Server Folder"
					onChange={(e) => {
						setName(e.currentTarget.value.trim());
					}}
				/>
				<h4>Folder Color</h4>
				<ColorPicker
					value={numberToHexColor(color())}
					setValue={(v) => setColor(hexColorToNumber(v))}
					default={numberToHexColor(defaultFolderColor)}
				/>
			</ModalBody>
			<ModalFooter>
				<button
					onClick={() => {
						setGuildFolders(props.folderId, { color: color(), name: name() });
						close();
					}}
				>
					Done
				</button>
			</ModalFooter>
		</GenericModal>
	);
}
