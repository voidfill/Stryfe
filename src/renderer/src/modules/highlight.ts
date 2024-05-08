import { Logger } from "@modules/logger";

import highlightworker from "./highlightworker?worker&inline";

const logger = new Logger("highlight.js", "green");

const hw = new highlightworker();
hw.onerror = (e): void => {
	logger.error(e);
};

let Id = 0;
const cbs = new Map<string, (result: string) => void>();
hw.onmessage = ({ data }: MessageEvent<{ id: string; result: string }>): void => {
	const { id, result } = data;
	const cb = cbs.get(id);
	if (!cb) return;
	cb(result);
	cbs.delete(id);
};

export default function highlight(code: string, lang: string, cb: (result: string) => void, ignoreIllegals = true): string {
	const id = `${Id++}`;
	cbs.set(id, cb);
	hw.postMessage({ code, id, ignoreIllegals, lang });
	return id;
}

export function unRegister(id: string): void {
	cbs.delete(id);
}
