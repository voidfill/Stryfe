import { createEffect, createMemo, createSignal, getOwner, JSX, onCleanup, ParentProps, runWithOwner, sharedConfig } from "solid-js";
import { Dynamic, insert } from "solid-js/web";

import globalSheet from "@renderer/global.css@sheet";
import { theme } from "@renderer/signals";

const themeSheet = new CSSStyleSheet();
createEffect(() => themeSheet.replaceSync(`:root, :host { --theme: ${theme()}; }`));

document.adoptedStyleSheets.push(themeSheet, globalSheet);

// https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to
type validShadowHosts =
	| "div"
	| "article"
	| "aside"
	| "blockquote"
	| "footer"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "header"
	| "main"
	| "nav"
	| "p"
	| "section"
	| "span";

const existingSheets = new Map<string, WeakRef<CSSStyleSheet>>();
function getOrCreateSheet(css: string): CSSStyleSheet {
	const existing = existingSheets.get(css);
	if (existing) {
		const sheet = existing.deref();
		if (sheet) return sheet;
	}

	const sheet = new CSSStyleSheet();
	sheet.replace(css).catch(console.error);
	existingSheets.set(css, new WeakRef(sheet));
	return sheet;
}

type css = string | CSSStyleSheet;
export function mergeIntoSheet(destination: CSSStyleSheet, sources: css[]): void {
	for (const style of sources.map((s) => (typeof s === "string" ? getOrCreateSheet(s) : s)))
		for (const rule of style.cssRules) destination.insertRule(rule.cssText, destination.cssRules.length);
}

/**
 * A component that creates a shadow root to prevent inheriting stylesheets from the parent.
 *
 * @param {Object} props The props for the component.
 * @param {string | CSSStyleSheet} props.css The CSS to apply inside the shadow root.
 * @param {validShadowHosts} props.as The tag name of the shadow host. Defaults to "div".
 * @param {string} props.class The class name to apply to the shadow host.
 * @param {Record<string, boolean>} props.classList The class names to apply to the shadow host.
 * @param {boolean} props.noDisplayContents Whether to set the default display style to "contents".
 */
export function ShadowCss(
	props: ParentProps<{
		as?: validShadowHosts;
		class?: string;
		classList?: { [k: string]: boolean | undefined };
		css?: css | css[];
		noDisplayContents?: boolean;
	}>,
): JSX.Element {
	// honestly i dont really understand whats going on here, i just tried my best to copy solidjs Portal implementation
	const owner = getOwner();
	const marker = document.createTextNode("");
	let hydrating = !!sharedConfig.context;
	const [ref, setRef] = createSignal<HTMLElement | null>(null);

	createEffect(
		() => {
			if (hydrating) (getOwner() as any).user = hydrating = false;
			const el = ref();
			if (!el) return;

			const shadow = el.attachShadow({ mode: "open" });
			shadow.adoptedStyleSheets.push(themeSheet, globalSheet);
			if (props.css)
				for (const style of Array.isArray(props.css) ? props.css : [props.css])
					shadow.adoptedStyleSheets.push(typeof style === "string" ? getOrCreateSheet(style) : style);

			// eslint-disable-next-line solid/reactivity
			const content = runWithOwner(owner, () => createMemo(() => props.children));
			Object.defineProperty(el, "_$host", {
				configurable: true,
				get() {
					return marker.parentNode;
				},
			});
			insert(shadow, content);
			onCleanup(() => el.remove());
		},
		undefined,
		{
			render: !hydrating,
		},
	);

	return (
		<Dynamic
			ref={setRef}
			component={props.as ?? "div"}
			attr:shadow-css=""
			style={props.noDisplayContents ? undefined : { display: "contents" }}
			class={props.class}
			classList={props.classList}
		/>
	);
}
