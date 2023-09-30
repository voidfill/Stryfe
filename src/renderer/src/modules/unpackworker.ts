import { Logger } from "./logger";

const erl = require("erl");
import pako from "pako";

const logger = new Logger("UnpackWebWorker", "blue");

let inflator: pako.Inflate;
let inflatedChunks: Uint8Array[] = [];

function setupInflator(): void {
	inflator = new pako.Inflate({
		chunkSize: 65536,
	});
	inflatedChunks = [];
	inflator.onData = (data: Uint8Array): void => void inflatedChunks.push(data);
}

setupInflator();

onmessage = ({ data }: MessageEvent<"reset" | ArrayBuffer>): void => {
	if (data === "reset") return setupInflator();
	if (!(data instanceof ArrayBuffer)) return logger.warn("Invalid message:", data);

	const len = data.byteLength,
		doFlush = len >= 4 && new DataView(data).getUint32(len - 4, false) === 65535;
	inflator.push(new Uint8Array(data), doFlush && pako.Z_SYNC_FLUSH);

	if (inflator.err) logger.error("Failed to inflate message:", inflator.msg);

	if (doFlush && !inflator.err) {
		const len = inflatedChunks.length;
		if (len === 0) return logger.warn("Tried to unpack without data");

		let buf: Uint8Array;
		if (len === 1) {
			buf = inflatedChunks[0];
		} else {
			const rlen = inflatedChunks.reduce((a, b) => a + b.byteLength, 0);
			buf = new Uint8Array(rlen);
			let offset = 0;

			for (const chunk of inflatedChunks) {
				buf.set(chunk, offset);
				offset += chunk.byteLength;
			}
		}

		inflatedChunks = [];

		postMessage(erl.unpack(buf));
	}
};
