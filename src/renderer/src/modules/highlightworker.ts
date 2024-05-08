import hljs from "highlight.js";

onmessage = ({ data }: MessageEvent<{ code: string; id: string; ignoreIllegals: boolean; lang: string }>): void => {
	const { code, lang, ignoreIllegals, id } = data;
	const result = hljs.highlight(code, { ignoreIllegals, language: lang });
	postMessage({ id, result: result.value });
};
