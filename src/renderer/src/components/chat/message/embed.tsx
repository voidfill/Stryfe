import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";
import { boolean, fallback } from "valibot";

import { storedEmbed } from "@stores/embeds";
import Persistent from "@stores/persistent";

import { parse } from "@components/common/md";
import { MaybeSpoiler, Media, Youtube } from "@components/common/media";

import "./embed.scss";

const maxHeight = 225;
const maxWidth = 400;

function isYoutubeEmbedUrl(url: string): boolean {
	const u = new URL(url);
	if (u.hostname !== "www.youtube.com") return false;
	if (!u.pathname.startsWith("/embed/")) return false;
	return true;
}

export const [allowYoutubeEmbedDescription, setAllowYoutubeEmbedDescription] = Persistent.registerSignal(
	"allowYoutubeEmbedDescription",
	fallback(boolean(), false),
);

export default function Embed(props: { embed: storedEmbed; spoilers: { [key: string]: boolean } }): JSX.Element {
	const isSpoilered = createMemo(() => (props.embed.url && props.spoilers[props.embed.url]) || false);
	const color = createMemo(() => (props.embed.color ? `#${props.embed.color.toString(16).padStart(6, "0")}` : ""));
	const isYoutubeEmbed = createMemo(() => {
		const v = props.embed.video;
		if (!v || !v.url || !v.height || !v.width) return false;
		const t = props.embed.thumbnail;
		if (!t || !t.proxy_url || !t.height || !t.width) return false;
		return isYoutubeEmbedUrl(v.url);
	});

	// TODO: appropriate image sizes

	return (
		<MaybeSpoiler is_spoiler={isSpoilered()}>
			<Switch
				fallback={
					<div class="message-embed" style={props.embed.color ? { "border-color": color() } : {}}>
						<Show when={!!(props.embed.provider?.name || props.embed.provider?.url) && props.embed.provider}>
							{(p) => (
								<div class="embed-provider">
									<Show when={p().url} fallback={<span>{p().name}</span>}>
										<span>{p().name || p().url /* TODO: hook up maybe outgoing link */}</span>
									</Show>
								</div>
							)}
						</Show>
						<Show when={props.embed.author}>
							{(a) => (
								<div class="embed-author">
									<Show when={a().proxy_icon_url}>
										<img src={a().proxy_icon_url} width={16} height={16} alt={a.name} />
									</Show>
									<Show when={true /* TODO: link */}>
										<span>{a().name}</span>
									</Show>
								</div>
							)}
						</Show>
						<Show when={props.embed.title}>
							{(t) => (
								<div class="embed-title">
									<Show when={true /* TODO: link */}>
										<span>{t()}</span>
									</Show>
								</div>
							)}
						</Show>
						<Show when={(allowYoutubeEmbedDescription() || !isYoutubeEmbed()) && props.embed.description}>
							{(d) => {
								const md = createMemo(() => parse(d(), { allowHeading: true, inline: true, outputData: {} }));

								return <div class="embed-description">{md().element}</div>;
							}}
						</Show>
						<For each={props.embed.fields ?? []}>
							{(field) => (
								<div class="embed-field">
									{field.name}: {field.value}
								</div>
							)}
						</For>
						<Show when={props.embed.images?.length || props.embed.video || props.embed.thumbnail}>
							<div class="embed-media">
								<Show when={props.embed.video}>
									{(v) => (
										<Show when={isYoutubeEmbed()} fallback={<Media content_type="video" {...v()} />}>
											<Youtube
												// blehhh basically typechecked anyways, im lazy
												video={v() as any}
												thumbnail={props.embed.thumbnail as any}
												originalURL={props.embed.url!}
											/>
										</Show>
									)}
								</Show>
								<For each={props.embed.images ?? []}>
									{(image) => <Media maxHeight={maxHeight} maxWidth={maxWidth} content_type="image" {...image} />}
								</For>
								<Show when={!props.embed.video && !props.embed.images?.length && props.embed.thumbnail}>
									{(t) => <Media maxHeight={maxHeight} maxWidth={maxWidth} content_type="image" {...t()} />}
								</Show>
							</div>
						</Show>
						<Show when={props.embed.footer}>
							{(f) => (
								<div class="embed-footer">
									<Show when={true /* TODO: link */}>
										<span>{f().text}</span>
									</Show>
								</div>
							)}
						</Show>
					</div>
				}
			>
				<Match when={props.embed.type === "image" && props.embed.thumbnail}>
					{(i) => <Media content_type="image" embedURL={props.embed.url} {...i()} />}
				</Match>
				<Match when={props.embed.type === "gifv" && props.embed.video}>
					{(v) => <Media content_type="gifv" embedURL={props.embed.url} {...v()} />}
				</Match>
				<Match
					when={
						props.embed.type === "video" &&
						props.embed.video &&
						!props.embed.author &&
						!props.embed.description &&
						!props.embed.fields?.length &&
						!props.embed.footer &&
						!props.embed.images?.length &&
						!props.embed.provider &&
						!props.embed.thumbnail &&
						!props.embed.timestamp &&
						!props.embed.title &&
						props.embed.video
					}
				>
					{(v) => <Media content_type="video" embedURL={props.embed.url} {...v()} />}
				</Match>
			</Switch>
		</MaybeSpoiler>
	);
}
