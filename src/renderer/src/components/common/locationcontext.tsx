import { Accessor, createContext, useContext } from "solid-js";

type l = {
	channelId: string;
	guildId: string;
	messageId?: string;
	selectedChannel: (v: string) => boolean;
	selectedGuild: (v: string) => boolean;
};

export const LocationContext = createContext<Accessor<l>>(() => ({
	channelId: "",
	guildId: "",
	selectedChannel: (): boolean => false,
	selectedGuild: (): boolean => false,
}));

export const useLocationContext = (): Accessor<l> => useContext(LocationContext);
