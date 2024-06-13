import { AnsiUp } from "ansi_up";
import hljs from "highlight.js";

const ansi_up = new AnsiUp();

onmessage = ({ data }: MessageEvent<{ code: string; id: string; ignoreIllegals: boolean; lang: string }>): void => {
	const { code, lang, ignoreIllegals, id } = data;

	if (lang === "ansi") return void postMessage({ id, result: ansi_up.ansi_to_html(code) });

	if (!lang || !hljs.getLanguage(lang)) return void postMessage({ id, result: code });
	try {
		const result = hljs.highlight(code, { ignoreIllegals, language: lang });
		postMessage({ id, result: result.value });
	} catch (err) {
		console.error("highlight.js error:", err);
		postMessage({ id, result: code });
	}
};
