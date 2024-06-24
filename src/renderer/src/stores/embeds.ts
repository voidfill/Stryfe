import { createStore, produce } from "solid-js/store";
import { InferOutput } from "valibot";

import _embed from "@constants/schemata/message/embed";

import { on } from "@modules/dispatcher";
import { p } from "@modules/patcher";

import { registerDebugStore } from ".";

type embed = InferOutput<typeof _embed>;

export type storedEmbed = DistributiveOmit<embed, "image"> & {
	images?: {
		height?: number;
		proxy_url?: string;
		url: string;
		width?: number;
	}[];
};

const [embeds, setEmbeds] = createStore<{ [messageId: string]: storedEmbed[] }>({});

function mergeEmbeds(embeds: embed[]): storedEmbed[] {
	if (!embeds.length) return [];

	const byUrl: { [url: string]: storedEmbed } = {};
	for (const embed of embeds) {
		const url = embed.url;
		if (!url) continue;
		const { image, ...rest } = embed,
			images = image ? [image] : [];
		if (!byUrl[url]) {
			byUrl[url] = { ...rest, images };
			continue;
		}

		const alreadyIn = (byUrl[url].images ??= []);
		alreadyIn.push(...images.slice(0, 4 - alreadyIn.length)); // max 4 images
	}

	const seen = new Set<string>();
	return embeds
		.filter((embed) => {
			if (!embed.url) return true;
			if (seen.has(embed.url)) return false;
			seen.add(embed.url);
			return true;
		})
		.map((embed) => {
			const url = embed.url;
			if (!url) return embed;
			return byUrl[url];
		});
}

// TODO: channel/guild/thread deletions
on("MESSAGE_CREATE", ({ id, embeds }) => {
	setEmbeds(id, mergeEmbeds(embeds ?? []));
});
on("MESSAGE_DELETE", ({ id }) => {
	setEmbeds(id, []);
});
on("MESSAGE_DELETE_BULK", ({ ids }) => {
	setEmbeds(
		produce((embeds) => {
			for (const id of ids) {
				delete embeds[id];
			}
		}),
	);
});
on("MESSAGE_UPDATE", ({ id, embeds }) => {
	setEmbeds(id, mergeEmbeds(embeds ?? []));
});
on("MESSAGES_FETCH_SUCCESS", ({ messages }) => {
	setEmbeds(
		produce((embeds) => {
			for (const message of messages) {
				embeds[message.id] = mergeEmbeds(message.embeds ?? []);
				if (message.referenced_message) embeds[message.referenced_message.id] = mergeEmbeds(message.referenced_message.embeds ?? []);
			}
		}),
	);
});

export const getEmbeds = p((messageId: string) => embeds[messageId] || undefined);

registerDebugStore("embeds", { getEmbeds, state: { embeds } });
