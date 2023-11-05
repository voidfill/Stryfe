import { createStore } from "solid-js/store";

import Store from ".";

import { FrecencyUserSettings, PreloadedUserSettings } from "discord-protos";

export const enum UserSettingsType {
	PRELOADED_USER_SETTINGS = 1,
	FRECENCY_AND_FAVORITES_SETTINGS = 2,
	TEST_SETTINGS = 3, // explode
}

const [frecencySettings, setFrecencySettings] = createStore<FrecencyUserSettings>({});
const [preloadedSettings, setPreloadedSettings] = createStore<PreloadedUserSettings>({});

// thanks SO https://stackoverflow.com/a/21797381
function base64ToUint8Array(base64): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export default new (class SettingsStore extends Store {
	constructor() {
		super({
			// await connect to make sure token is valid trolley
			GATEWAY_CONNECT: () => {
				// TODO: fetch frecency settings from https://discord.com/api/v9/users/@me/settings-proto/2
			},
			READY: ({ user_settings_proto }) => {
				setPreloadedSettings(PreloadedUserSettings.fromBinary(base64ToUint8Array(user_settings_proto)));
			},
		});
	}

	preloadedSettings = preloadedSettings;
	frecencySettings = frecencySettings;
})();
