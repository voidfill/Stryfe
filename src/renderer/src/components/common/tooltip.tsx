import { Accessor, createEffect, createRenderEffect, createSignal, JSX as _JSX, onCleanup, onMount, ParentComponent, Ref } from "solid-js";

import "./tooltip.scss";

import { addLayer, removeLayer } from "@renderer/modules/layers";

// Thanks to [Neodymium](https://github.com/Neodymium7) and solidcord for large parts of this code.
// https://gyazo.com/1ea7e2289f0c56baef25757814183297

export enum TooltipColors {
	PRIMARY = "primary",
	BLACK = "black",
	GRAY = "gray",
	GREEN = "green",
	YELLOW = "yellow",
	RED = "red",
}

export enum TooltipPosition {
	RIGHT = "right",
	LEFT = "left",
	TOP = "top",
	BOTTOM = "bottom",
}

const getOffset = (midpoint: number, distance: number, max: number, margin = 10): number => {
	let offset = 0;
	if (midpoint + distance > max - margin) {
		offset = max - margin - (midpoint + distance);
	} else if (midpoint - distance < margin) {
		offset = margin - (midpoint - distance);
	}
	return offset;
};

const getTooltipCoordinates = (
	targetRect: DOMRect,
	tooltip: HTMLDivElement,
	position: TooltipPosition,
	spacing = 8,
): {
	offsetX: number;
	offsetY: number;
	x: number;
	y: number;
} => {
	let x: number,
		y: number,
		offsetX = 0,
		offsetY = 0;

	switch (position) {
		case TooltipPosition.TOP:
			x = targetRect.x + targetRect.width / 2 - tooltip.clientWidth / 2;
			y = targetRect.y - tooltip.clientHeight - spacing;
			offsetX = getOffset(targetRect.x + targetRect.width / 2, tooltip.clientWidth / 2, window.innerWidth);
			break;
		case TooltipPosition.BOTTOM:
			x = targetRect.x + targetRect.width / 2 - tooltip.clientWidth / 2;
			y = targetRect.y + targetRect.height + spacing;
			offsetX = getOffset(targetRect.x + targetRect.width / 2, tooltip.clientWidth / 2, window.innerWidth);
			break;
		case TooltipPosition.RIGHT:
			x = targetRect.x + targetRect.width + spacing;
			y = targetRect.y + targetRect.height / 2 - tooltip.clientHeight / 2;
			offsetY = getOffset(targetRect.y + targetRect.height / 2, tooltip.clientHeight / 2, window.innerHeight);
			break;
		default:
			x = targetRect.x - tooltip.clientWidth - spacing;
			y = targetRect.y + targetRect.height / 2 - tooltip.clientHeight / 2;
			offsetY = getOffset(targetRect.y + targetRect.height / 2, tooltip.clientHeight / 2, window.innerHeight);
			break;
	}

	return { offsetX, offsetY, x, y };
};

type TooltipElementProps = {
	hidden: boolean;
	onMount: () => void;
	pointerEvents?: boolean;
	position?: TooltipPosition;
	ref: Ref<HTMLDivElement>;
	spacing?: number;
	targetRect: DOMRect;
};

const TooltipElement: ParentComponent<TooltipElementProps> = (props) => {
	let tooltip: HTMLDivElement;
	const [coordinates, setCoordinates] = createSignal({ offsetX: 0, offsetY: 0, x: 0, y: 0 });

	onMount(() => {
		props.onMount();
		setCoordinates(getTooltipCoordinates(props.targetRect, tooltip, props.position || TooltipPosition.TOP, props.spacing));
	});

	return (
		<div
			classList={{
				"tooltip-hidden": props.hidden,
				"tooltip-layer": true,
				"tooltip-pointer-enabled": props.pointerEvents,
			}}
			style={{
				"--offsetX": `${coordinates().offsetX}px`,
				"--offsetY": `${coordinates().offsetY}px`,
				"--x": `${coordinates().x}px`,
				"--y": `${coordinates().y}px`,
			}}
		>
			<div
				ref={(el): void => {
					(props.ref as (val: HTMLDivElement) => void)(el);
					tooltip = el;
				}}
				class={`tooltip tooltip-${props.color || TooltipColors.PRIMARY}`}
			>
				<div class="tooltip-content"> {props.children} </div>
				<div class={`tooltip-pointer tooltip-${props.position || TooltipPosition.TOP}`} />
			</div>
		</div>
	);
};

type TooltipProps = {
	content: () => _JSX.Element;
	delay?: number;
	pointerEvents?: boolean;
	position?: TooltipPosition;
	spacing?: number;
	suppress?: boolean;
};

export default function Tooltip(element: Element, value: Accessor<TooltipProps>): void {
	let tooltip: HTMLDivElement;
	let tooltipId: number | undefined;
	let transitionTimeout: NodeJS.Timeout | undefined;
	let delayTimeout: NodeJS.Timeout | undefined;
	const [hidden, setHidden] = createSignal(true);

	const show = (): void => {
		if (value().suppress) {
			return;
		}

		if (delayTimeout) {
			clearTimeout(delayTimeout);
			delayTimeout = undefined;
		}

		if (tooltipId !== undefined) {
			clearTimeout(transitionTimeout);
			removeLayer(tooltipId);
			transitionTimeout = undefined;
		}

		tooltipId = addLayer(() => (
			<TooltipElement
				ref={tooltip}
				position={value().position}
				color={value().color}
				spacing={value().spacing}
				targetRect={element.getBoundingClientRect()}
				hidden={hidden()}
				pointerEvents={value().pointerEvents}
				onMount={(): void => void setHidden(false)}
			>
				{value().content()}
			</TooltipElement>
		));
	};

	const hide = (): void => {
		if (delayTimeout) {
			clearTimeout(delayTimeout);
			delayTimeout = undefined;
		}

		setHidden(true);

		transitionTimeout = setTimeout(() => {
			removeLayer(tooltipId!);
			tooltipId = undefined;
			transitionTimeout = undefined;
			delayTimeout = undefined;
		}, 100);
	};

	const handleMouseEnter = (): void => {
		if (value().delay) {
			delayTimeout = setTimeout(() => {
				show();
			}, value().delay);
		} else {
			show();
		}
	};

	const handleMouseLeave = (): void => {
		if (!value().pointerEvents) {
			hide();
			return;
		}

		if (delayTimeout) {
			clearTimeout(delayTimeout);
			delayTimeout = undefined;
			return;
		}

		const pointerEventsTimeout = setTimeout(hide, 300);

		const tooltipEnter = (): void => {
			clearTimeout(pointerEventsTimeout);
			tooltip.addEventListener("mouseleave", hide, { once: true });
		};
		tooltip.addEventListener("mouseenter", tooltipEnter, { once: true });
	};

	createEffect(() => {
		if (value().suppress) {
			hide();
		}
	});

	createRenderEffect(() => {
		element.addEventListener("mouseenter", handleMouseEnter);
		element.addEventListener("mouseleave", handleMouseLeave);
		element.addEventListener("mousedown", hide);
		window.addEventListener("scroll", hide, true);

		onCleanup(() => {
			element.removeEventListener("mouseenter", handleMouseEnter);
			element.removeEventListener("mouseleave", handleMouseLeave);
			element.removeEventListener("mousedown", hide);
			window.removeEventListener("scroll", hide, true);
		});
	});
}

declare module "solid-js" {
	// eslint-disable-next-line
	namespace JSX {
		interface Directives {
			TooltipDirective: TooltipProps;
		}
	}
}
