const erl = require("erl");

onmessage = ({ data }: MessageEvent<object>): void => {
	const res = erl.pack(data);
	// @ts-expect-error this is not a shared worker
	postMessage(res, [res.buffer]);
};
