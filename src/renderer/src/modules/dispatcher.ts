import { _dispatches } from "@constants/schemata";

import { Logger } from "./logger";
const logger = new Logger("Dispatcher", "purple");

export type Listener<T> = T extends undefined ? () => void : (args: T) => void;

export class EventEmitter<
	T extends {
		[key: string]: any;
	},
> {
	#listeners = new Map<keyof T, Set<(args?: any) => void>>();

	emit<K extends keyof PickByType<T, undefined>>(event: K): void;
	emit<K extends keyof OmitByType<T, undefined>>(event: K, args: T[K]): void;
	emit<K extends keyof T>(event: K, args?: T[K]): void {
		logger.log(`Emitting event ${String(event)}`, args);
		if (!this.#listeners.has(event)) return;
		for (const listener of this.#listeners.get(event)!) listener(args);
	}

	addListener<K extends keyof T>(event: K, listener: Listener<T[K]>): () => void {
		if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
		this.#listeners.get(event)?.add(listener);
		return () => this.removeListener(event, listener);
	}

	on = this.addListener.bind(this);

	removeListener<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
		if (!this.#listeners.has(event)) return;
		this.#listeners.get(event)!.delete(listener);
		if (this.#listeners.get(event)!.size === 0) this.#listeners.delete(event);
	}

	removeAllListeners<K extends keyof T>(event?: K): void {
		if (event) {
			this.#listeners.delete(event);
		} else {
			this.#listeners.clear();
		}
	}

	once<K extends keyof T>(event: K, listener: Listener<T[K]>): () => void {
		const remove = this.addListener(event, ((args) => {
			remove();
			listener(args);
		}) as Listener<T[K]>); // we do a bit of trolling.
		return remove;
	}
}

export type dispatches = customDispatches & _dispatches;
declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface customDispatches {}
	interface Window {
		Dispatcher: EventEmitter<dispatches>;
	}
}

export default window.Dispatcher = new (class Dispatcher extends EventEmitter<dispatches> {})();
