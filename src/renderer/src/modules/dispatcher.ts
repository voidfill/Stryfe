import { _dispatches } from "@constants/schemata";

import { Logger } from "./logger";
const logger = new Logger("Dispatcher", "purple");

export type Listener<T> = (...args: T extends undefined ? [] : [T]) => void;

export class EventEmitter<
	T extends {
		[key: string]: any;
	},
> {
	#listeners = new Map<keyof T, Set<Listener<any>>>();

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
			// @ts-expect-error this is fixable but not worth the effort
			listener(args);
		}) as Listener<T[K]>);
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

const dispatcher = (window.Dispatcher = new (class Dispatcher extends EventEmitter<dispatches> {})());
export default dispatcher;

const emit = dispatcher.emit.bind(dispatcher);
const addListener = dispatcher.addListener.bind(dispatcher);
const on = dispatcher.on.bind(dispatcher);
const removeListener = dispatcher.removeListener.bind(dispatcher);
const removeAllListeners = dispatcher.removeAllListeners.bind(dispatcher);
const once = dispatcher.once.bind(dispatcher);

export { emit, addListener, on, removeListener, removeAllListeners, once };
