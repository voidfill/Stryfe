import { createEffect, createMemo, FlowProps, For, JSX, mergeProps, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { createToken, createTokenizer, resolveTokens } from "@solid-primitives/jsx-tokenizer";

import "./timeline.scss";

type tokenData = {
	class?: string;
	description?: JSX.Element;
	title: JSX.Element;
};

const tokenizer = createTokenizer<tokenData>({
	name: "Timeline Tokenizer",
});

let counter = 0n;

export function Timeline(props: FlowProps<{ bulletSize?: number; lineWidth?: number; state: number }>): JSX.Element {
	// eslint-disable-next-line solid/reactivity
	const tokens = resolveTokens(tokenizer, () => props.children);
	const [sizes, setSizes] = createStore<number[]>([]);
	const id = `timeline-mask-${counter++}`;

	const p = mergeProps({ bulletSize: 10, lineWidth: 2 }, props);

	function aggregateTo(n: number): number {
		let acc = 0;
		for (let i = 0; i < n; i++) {
			acc += sizes[i] ?? 0;
		}
		return acc;
	}

	const totalHeight = createMemo(() => aggregateTo(tokens().length));
	const curGradientHeight = createMemo(() => aggregateTo(props.state) + ((sizes[props.state] ?? 0) + p.bulletSize) / 2);

	return (
		<>
			<div class="timeline" style={{ "--tl-bullet-size": `${p.bulletSize}px`, "--tl-grad-at": `${curGradientHeight()}px` }}>
				<svg class="timeline-line" width={p.bulletSize} height={totalHeight()}>
					<mask id={id} width={p.bulletSize} height={totalHeight()}>
						<rect x={0} y={0} width={p.bulletSize} height={totalHeight()} fill="black" />
						<rect x={(p.bulletSize - p.lineWidth) / 2} y={0} width={p.lineWidth} height={totalHeight()} fill="white" />
						<rect x={0} y={0} width={p.bulletSize} height={((sizes[0] ?? 0) - p.bulletSize) / 2} fill="black" />
						<rect
							x={0}
							y={totalHeight() - ((sizes[tokens().length - 1] ?? 0) - p.bulletSize) / 2}
							width={p.bulletSize}
							height={((sizes[tokens().length - 1] ?? 0) - p.bulletSize) / 2}
							fill="black"
						/>
						<For each={tokens()}>
							{(_, i) => (
								<circle
									cx={p.bulletSize / 2}
									cy={aggregateTo(i()) + (sizes[i()] ?? 0) / 2}
									r={(p.bulletSize - p.lineWidth) / 2}
									fill="black"
									stroke="white"
									stroke-width={p.lineWidth}
								/>
							)}
						</For>
					</mask>
					<foreignObject style={{ mask: `url(#${id})` }} width={p.bulletSize} height={totalHeight()}>
						<div class="timeline-background" style={{ height: totalHeight() + "px" }} />
					</foreignObject>
				</svg>
				<div class="timeline-content">
					<For each={tokens()}>
						{(t, i) => {
							let ref: HTMLDivElement | undefined;

							onMount(() => {
								createEffect(() => {
									i();
									if (!ref) return;
									setSizes(i(), ref.clientHeight);
								});

								const observer = new ResizeObserver(() => {
									setSizes(i(), ref!.clientHeight);
								});
								observer.observe(ref!);

								onCleanup(() => observer.disconnect());
							});

							return (
								<div classList={{ "timeline-item": true, [t.data.class ?? ""]: !!t.data.class }} ref={ref}>
									<div class="timeline-title">{t.data.title}</div>
									<Show when={t.data.description}>
										<div class="timeline-description">{t.data.description}</div>
									</Show>
								</div>
							);
						}}
					</For>
				</div>
			</div>
		</>
	);
}

export const TimelineItem = createToken<tokenData, tokenData>(
	tokenizer,
	(p) => p,
	() => <span>TimelineItem</span>,
);
