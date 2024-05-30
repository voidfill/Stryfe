import { createEffect, createMemo, createSignal, FlowProps, JSX, Match, onCleanup, Show, Switch } from "solid-js";

import { base64ToUint8Array } from "@stores/settings";

import { FiSlash } from "solid-icons/fi";

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
	filename: string;
	height?: number | null;
	is_clip?: boolean;
	is_explicit?: boolean;
	is_remix?: boolean;
	is_spoiler?: boolean;
	is_thumbnail?: boolean;
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
				<Match when={props.is_clip}>{Clip(props)}</Match>
				<Match when={props.content_type?.startsWith("image/") && props.width && props.height && props.size && props.proxy_url}>
					{Image(props as Parameters<typeof Image>[0])}
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

function Image(props: props & { height: number; proxy_url: string; size: number; width: number }): JSX.Element {
	const [loaded, setLoaded] = createSignal(false);
	const [error, setError] = createSignal(false);
	const ns = createMemo(
		() => fit(props.height, props.width, maxHeight, maxWidth, error() ? minHeightOnError : 0, error() ? minWidthOnError : 0),
		undefined,
		{
			equals: (a, b) => a.height === b.height && a.width === b.width,
		},
	);
	const u = createMemo(() => urlWithDimensions(props.proxy_url, ns().height, ns().width));

	return (
		<div class="media media-image" style={{ height: `${ns().height}px`, width: `${ns().width}px` }}>
			<img src={u()} alt={props.description ?? ""} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
			<Placeholder hidden={loaded()} placeholder={props.placeholder ?? ""} placeholder_version={props.placeholder_version ?? 0} />
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

function Clip(props: props): JSX.Element {
	return <span>this is a clip.</span>;
}
