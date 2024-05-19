import { ruleTypeGuard } from "./lib";
import { MentionBox } from "./util";

export default ruleTypeGuard({
	doesMatch: (source) => {
		const match =
			/^https:\/\/(?:(?:media|images)\.discordapp\.net|(?:cdn\.discordapp\.com))\/(?:attachments|ephemeral-attachments)\/\d+\/\d+\/([A-Za-z0-9._-]*[A-Za-z0-9_-])(?:[?][a-zA-Z0-9?&=_-]*)?/.exec(
				source,
			);
		if (!match) return null;
		return {
			capture: match[0],
			data: {
				filename: match[1],
				url: match[0],
			},
		};
	},
	element: (data, _, state) => {
		if (state.inSpoiler) {
			state.outputData.spoilers ??= {};
			state.outputData.spoilers[data.url] = true;
		}

		return <MentionBox>{data.filename}</MentionBox>;
	},
	order: 15.5,
	requiredFirstCharacters: "https://",
});
