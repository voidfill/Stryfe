import { safeParse } from "valibot";

import { dispatches as __allDispatches } from "@constants/schemata";

import { Logger } from "./logger";

import { OPCodes } from "@renderer/constants/gateway";

const erl = require("erl");
const Zlibsync = require("zlib-sync");

const logger = new Logger("UnpackWebWorker", "blue");

let inflator: import("zlib-sync").Inflate;
let inflatedChunks: Buffer[] = [];

function setupInflator(): void {
	inflator = new Zlibsync.Inflate({
		chunkSize: 65536,
	});
	inflatedChunks = [];
}

setupInflator();

onmessage = ({ data: message }: MessageEvent<"reset" | { data: ArrayBuffer; typecheck?: boolean }>): void => {
	if (message === "reset") return setupInflator();
	const { typecheck, data } = message;
	if (!(data instanceof ArrayBuffer)) return logger.warn("Invalid message:", message);

	const len = data.byteLength,
		doFlush = len >= 4 && new DataView(data).getUint32(len - 4, false) === 65535;
	inflator.push(Buffer.from(data), doFlush && Zlibsync.Z_SYNC_FLUSH);

	if (inflator.err) logger.error("Failed to inflate message:", inflator.msg);
	else inflatedChunks.push(inflator.result as Buffer);

	if (doFlush && !inflator.err) {
		const len = inflatedChunks.length;
		if (len === 0) return logger.warn("Tried to unpack without data");

		let buf: Buffer;
		if (len === 1) {
			buf = inflatedChunks[0];
		} else {
			const rlen = inflatedChunks.reduce((a, b) => a + b.byteLength, 0);
			buf = Buffer.alloc(rlen);
			let offset = 0;

			for (const chunk of inflatedChunks) {
				buf.set(chunk, offset);
				offset += chunk.byteLength;
			}
		}

		inflatedChunks = [];

		const out = erl.unpack(buf);

		if (!typecheck || out.op !== OPCodes.DISPATCH) return void postMessage(out);

		if (!(out.t in __allDispatches)) return logger.error("Unknown dispatch:", out.t, out.d);

		const res = safeParse(__allDispatches[out.t as keyof typeof __allDispatches], out.d);
		if (!res.success) return logger.error("Failed to parse dispatch:", out.t, res.issues, out.d);

		out.d = res.output;

		postMessage(out);
	}
};
