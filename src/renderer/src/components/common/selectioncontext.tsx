import { createContext, useContext } from "solid-js";

export const SelectedGuildContext = createContext<(s: string) => boolean>(() => false);
export const SelectedChannelContext = createContext<(s: string) => boolean>(() => false);

export const useSelectedGuildContext = (): ((s: string) => boolean) => useContext(SelectedGuildContext);
export const useSelectedChannelContext = (): ((s: string) => boolean) => useContext(SelectedChannelContext);
