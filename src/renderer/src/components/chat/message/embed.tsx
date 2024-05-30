import { createMemo, For, JSX, Match, Show, Switch } from "solid-js";
import { Output } from "valibot";

import _embed from "@constants/schemata/message/embed";

import "./embed.scss";

import { parse } from "@renderer/components/common/md";
import { MaybeSpoiler } from "@renderer/components/common/media";

type embed = Output<typeof _embed>;

export default function Embed(props: { embed: embed; spoilers: { [key: string]: boolean } }): JSX.Element {
	const isSpoilered = createMemo(() => (props.embed.url && props.spoilers[props.embed.url]) || false);
	const color = createMemo(() => (props.embed.color ? `#${props.embed.color.toString(16).padStart(6, "0")}` : ""));

	// TODO: appropriate image sizes

	return (
		<MaybeSpoiler is_spoiler={isSpoilered()}>
			<Switch
				fallback={
					<div class="message-embed" style={props.embed.color ? { "border-color": color() } : {}}>
						<Show when={Object.values(props.embed.provider || {}).length >= 0 && props.embed.provider}>
							{(p) => (
								<div class="embed-provider">
									<Show when={p().url} fallback={<span>{p.name}</span>}>
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
						<Show when={props.embed.description}>
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
						{/* TODO: embed media stuff */}
						<Show when={props.embed.footer}>
							{(f) => (
								<div class="embed-footer">
									<Show when={true /* TODO: link */}>
										<span>{f().text}</span>
									</Show>
								</div>
							)}
						</Show>
						<div>raw: {JSON.stringify(props.embed)}</div>
					</div>
				}
			>
				<Match when={props.embed.type === "image" && props.embed.thumbnail}>image</Match>
				<Match when={props.embed.type === "gifv" && props.embed.video}>gifv</Match>
				<Match when={props.embed.type === "video" && props.embed.video}>video</Match>
			</Switch>
		</MaybeSpoiler>
	);
}
