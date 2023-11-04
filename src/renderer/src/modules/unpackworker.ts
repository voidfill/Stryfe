import { Logger } from "./logger";

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

onmessage = ({ data }: MessageEvent<"reset" | ArrayBuffer>): void => {
	if (data === "reset") return setupInflator();
	if (!(data instanceof ArrayBuffer)) return logger.warn("Invalid message:", data);

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

		postMessage(erl.unpack(buf));
	}
};
