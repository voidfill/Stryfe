import { Accessor, createEffect, createMemo, createSignal, FlowProps, JSX, Match, onCleanup, onMount, Show, Switch } from "solid-js";

import { base64ToUint8Array } from "@stores/settings";

import { FaRegularStar, FaSolidStar } from "solid-icons/fa";
import { FiSlash } from "solid-icons/fi";

import { useAnimationContext } from "./animationcontext";
import tippy from "./tooltip";

import "./media.scss";

import { thumbHashToDataURL } from "thumbhash";

tippy;

const maxHeight = 350;
const maxWidth = 550;

const minHeightOnError = 100;
const minWidthOnError = 100;

type props = {
	content_type?: string;
	description?: string;
	duration_secs?: number;
	filename?: string;
	height?: number | null;
	is_clip?: boolean;
	is_explicit?: boolean;
	is_remix?: boolean;
	is_spoiler?: boolean;
	is_thumbnail?: boolean;
	maxHeight?: number;
	maxWidth?: number;
	placeholder?: string;
	placeholder_version?: number;
	proxy_url?: string;
	size?: number;
	url: string;
	width?: number | null;
};

export function Media(props: props): JSX.Element {
	return (
		<MaybeSpoiler is_spoiler={props.is_spoiler ?? false}>
			<Switch fallback={<div>Media fallback: {JSON.stringify(props)}</div>}>
				<Match when={props.content_type === "gifv" && props.width && props.height && props.proxy_url}>
					{GifV(props as Parameters<typeof GifV>[0])}
				</Match>
				<Match when={props.content_type?.startsWith("video") && props.width && props.height && props.proxy_url}>
					{Video(props as Parameters<typeof Video>[0])}
				</Match>
				<Match when={props.content_type?.startsWith("image") && props.width && props.height && props.proxy_url}>
					{MediaImage(props as Parameters<typeof MediaImage>[0])}
				</Match>
			</Switch>
		</MaybeSpoiler>
	);
}

function fit(
	height: number,
	width: number,
	maxHeight: number,
	maxWidth: number,
	minHeight = 0,
	minWidth = 0,
): {
	height: number;
	width: number;
} {
	if (height === maxHeight && width === maxWidth) return { height, width };

	const wRatio = width > maxWidth ? maxWidth / width : 1;
	width = Math.max(minWidth, Math.round(width * wRatio));
	height = Math.max(minHeight, Math.round(height * wRatio));
	const hRatio = height > maxHeight ? maxHeight / height : 1;
	width = Math.max(minWidth, Math.round(width * hRatio));
	height = Math.max(minHeight, Math.round(height * hRatio));

	return { height, width };
}

export function MaybeSpoiler(props: FlowProps<{ is_spoiler: boolean }>): JSX.Element {
	return (
		<Show when={props.is_spoiler} fallback={props.children}>
			<Spoiler>{props.children}</Spoiler>
		</Show>
	);
}

function urlWithDimensions(url: string, height: number, width: number): string {
	const u = new URL(url);
	u.searchParams.set("height", height.toString());
	u.searchParams.set("width", width.toString());
	return u.toString();
}

function urlAsWebp(url: string): string {
	const u = new URL(url);
	u.searchParams.set("format", "webp");
	return u.toString();
}

function isValidBase64(str: string): Promise<boolean> {
	return new Promise((resolve) => {
		const i = new Image();
		i.onload = (): void => resolve(i.width > 0 && i.height > 0);
		i.onerror = (): void => resolve(false);
		i.src = str;
	});
}

function validBase64(str: Accessor<string>): Accessor<string | undefined> {
	const [valid, setValid] = createSignal<string | undefined>(undefined);

	createEffect(() => {
		const s = str();
		isValidBase64(s).then((v) => setValid(v ? s : undefined));
	});

	return valid;
}

export function Spoiler(props: FlowProps): JSX.Element {
	const [open, setOpen] = createSignal(false);

	return (
		<div classList={{ "spoiler-item": true, "spoiler-open": open() }} onClick={() => setOpen(true)}>
			<div class="spoiler-content-container">
				<div class="spoiler-content" aria-hidden={open()}>
					{props.children}
				</div>
			</div>
			<div class="spoiler-warning">
				<div class="warning-container">
					<strong>SPOILER</strong>
				</div>
			</div>
		</div>
	);
}

function Placeholder(props: { hidden: boolean; placeholder: string; placeholder_version: number }): JSX.Element {
	const dataURL = createMemo(() => (props.placeholder_version === 1 && thumbHashToDataURL(base64ToUint8Array(props.placeholder))) || undefined);
	const [reducedAnimationTime, setReducedAnimationTime] = createSignal(true);

	const timeout = setTimeout(() => setReducedAnimationTime(false), 50); // if we load in under 50ms its disk cache and we skip the opacity transition

	createEffect(() => props.hidden && clearTimeout(timeout));
	onCleanup(() => clearTimeout(timeout));

	return (
		<img
			classList={{
				hidden: props.hidden,
				"short-animation": reducedAnimationTime(),
				"thumb-placeholder": true,
			}}
			src={dataURL()}
			alt="placeholder"
		/>
	);
}

function Spinner(props: { hidden: boolean }): JSX.Element {
	const [didTimeout, setDidTimeout] = createSignal(false);
	const timeout = setTimeout(() => setDidTimeout(true), 1000);

	createEffect(() => props.hidden && clearTimeout(timeout));
	onCleanup(() => clearTimeout(timeout));

	return (
		<div classList={{ hidden: props.hidden || !didTimeout(), "loading-spinner": true }}>
			<div class="loading-spinner-inner" />
		</div>
	);
}

function AltText(props: { description: string }): JSX.Element {
	return (
		<div class="media-alt-text">
			<div class="media-alt-text-container">
				<strong
					use:tippy={{
						content: () => (
							<div class="tippy-alt-text">
								<strong class="alt-text-header">image description (alt text)</strong>
								<span class="alt-text-content">{props.description}</span>
							</div>
						),
						props: { arrow: false, placement: "right", trigger: "click" },
					}}
				>
					ALT
				</strong>
			</div>
		</div>
	);
}

function FavoriteStar(props: { url: string }): JSX.Element {
	const [isFavorite, setIsFavorite] = createSignal(false); // TODO: wire up to store / api

	return (
		<div class="media-favorite-star">
			<div classList={{ "is-favorite": isFavorite(), "media-favorite-star-container": true }} onClick={() => setIsFavorite(!isFavorite())}>
				<Show when={isFavorite()}>
					<FaSolidStar size={24} class="star" />
				</Show>
				<FaRegularStar size={28} class="star" />
			</div>
		</div>
	);
}

function MediaImage(props: props & { height: number; proxy_url: string; width: number }): JSX.Element {
	const [loaded, setLoaded] = createSignal(false);
	const [error, setError] = createSignal(false);
	const ns = createMemo(
		() =>
			fit(
				props.height,
				props.width,
				props.maxHeight || maxHeight,
				props.maxWidth || maxWidth,
				error() ? minHeightOnError : 0,
				error() ? minWidthOnError : 0,
			),
		undefined,
		{
			equals: (a, b) => a.height === b.height && a.width === b.width,
		},
	);
	const doAnimate = useAnimationContext();
	const isGif = createMemo(() => new URL(props.proxy_url).pathname.endsWith(".gif"));
	const u = createMemo(() => urlWithDimensions(props.proxy_url, ns().height, ns().width));

	return (
		<div class="media media-image" style={{ height: `${ns().height}px`, width: `${ns().width}px` }}>
			<img
				class="media-image-image"
				src={isGif() && !doAnimate() ? urlAsWebp(u()) : u()}
				alt={props.filename}
				onLoad={() => setLoaded(true)}
				onError={() => setError(true)}
			/>
			<Placeholder hidden={loaded()} placeholder={props.placeholder ?? ""} placeholder_version={props.placeholder_version ?? 0} />
			<Show when={isGif()}>
				<FavoriteStar url={props.url} />
			</Show>
			<Spinner hidden={loaded()} />
			<Show when={props.description}>
				<AltText description={props.description!} />
			</Show>
			<Show when={error()}>
				<div class="media-image-error">
					<FiSlash size={32} />
					<span>Could not load image</span>
				</div>
			</Show>
		</div>
	);
}

function Video(props: props & { content_type: string; height: number; proxy_url: string; width: number }): JSX.Element {
	let ref: HTMLVideoElement | undefined;
	const thumbhashDataUrl = createMemo(() => thumbHashToDataURL(base64ToUint8Array(props.placeholder ?? "")));
	// eslint-disable-next-line solid/reactivity
	const maybeValidThumb = validBase64(() => thumbhashDataUrl());
	const [error, setError] = createSignal(false);
	const [loadedPoster, setLoadedPoster] = createSignal(false);
	const ns = createMemo(
		() =>
			fit(
				props.height,
				props.width,
				props.maxHeight || maxHeight,
				props.maxWidth || maxWidth,
				error() ? minHeightOnError : 0,
				error() ? minWidthOnError : 0,
			),
		undefined,
		{
			equals: (a, b) => a.height === b.height && a.width === b.width,
		},
	);
	const posterUrl = createMemo(() => urlAsWebp(urlWithDimensions(props.proxy_url, ns().height, ns().width)));

	return (
		<div class="media media-video" style={{ height: `${ns().height}px`, width: `${ns().width}px` }}>
			<Show
				when={true}
				fallback={
					<>
						<FiSlash size={32} />
						<span>Could not load video</span>
					</>
				}
			>
				<video
					ref={ref}
					// we use a dummy image element to load the poster into cache, then switch out the thumb placeholder with the real poster
					poster={loadedPoster() ? posterUrl() : maybeValidThumb() || posterUrl()}
					src={props.proxy_url}
					style={{ height: `${ns().height}px`, width: `${ns().width}px` }}
					onError={() => setError(true)}
					preload="metadata"
					controls
					playsinline
					// @ts-expect-error this works
					disablepictureinpicture
				/>
				<img class="media-video-poster" src={posterUrl()} style={{ display: "none" }} onLoad={() => setLoadedPoster(true)} />
			</Show>
		</div>
	);
}

// apparently placeholders for these do exist but not render anything so we wont be using them
function GifV(props: props & { height: number; proxy_url: string; width: number }): JSX.Element {
	const doAnimate = useAnimationContext();
	const [error, setError] = createSignal(false);
	let ref: HTMLVideoElement | undefined;

	const ns = createMemo(
		() => fit(props.height, props.width, maxHeight, maxWidth, error() ? minHeightOnError : 0, error() ? minWidthOnError : 0),
		undefined,
		{
			equals: (a, b) => a.height === b.height && a.width === b.width,
		},
	);

	const posterUrl = createMemo(() => urlAsWebp(urlWithDimensions(props.proxy_url, ns().height, ns().width)));

	let playPromise = Promise.resolve();
	onMount(() => {
		createEffect(() => {
			doAnimate();
			playPromise.then(() => {
				if (doAnimate()) playPromise = ref!.play();
				else ref?.pause();
			});
		});
	});

	return (
		<div class="media media-gifv" style={{ height: `${ns().height}px`, width: `${ns().width}px` }}>
			<video
				ref={ref}
				style={{ height: `${ns().height}px`, width: `${ns().width}px` }}
				poster={posterUrl()}
				src={props.proxy_url}
				onError={() => setError(true)}
				preload="auto"
				playsinline
				loop
			/>
			<FavoriteStar url={props.url} />
			<Show when={error()}>
				<div class="media-image-error">
					<FiSlash size={32} />
					<span>Could not load GIF</span>
				</div>
			</Show>
		</div>
	);
}

export function Youtube(props: {
	maxHeight?: number;
	maxWidth?: number;
	thumbnail: { height: number; proxy_url: string; url: string; width: number };
	video: { height: number; url: string; width: number };
}): JSX.Element {
	const [show, setShow] = createSignal(false);
	const ns = createMemo(
		() =>
			fit(
				show() ? props.video.height : props.thumbnail.height,
				show() ? props.video.width : props.thumbnail.width,
				props.maxHeight || maxHeight,
				props.maxWidth || maxWidth,
				minHeightOnError,
				minWidthOnError,
			),
		undefined,
		{
			equals: (a, b) => a.height === b.height && a.width === b.width,
		},
	);

	const u = createMemo(() => {
		const u = new URL(props.video.url);
		u.searchParams.set("autoplay", "1");
		u.searchParams.set("auto_play", "1");
		return u.toString();
	});

	return (
		<div
			class="youtube-embed"
			style={{
				height: `${ns().height}px`,
				width: `${ns().width}px`,
			}}
		>
			<Show
				when={show()}
				fallback={
					<div class="thumbnail-container" onClick={() => setShow(true)}>
						<img class="thumbnail" src={urlWithDimensions(props.thumbnail.proxy_url, ns().height, ns().width)} alt="thumbnail" />
						<div class="buttons-container">
							<div class="play-button"></div>
							<div class="open-external-button"></div>
						</div>
					</div>
				}
			>
				<iframe
					src={u()}
					// @ts-expect-error this works
					frameborder="0"
					allow="autoplay; encrypted-media"
					allowfullscreen
				/>
			</Show>
		</div>
	);
}
