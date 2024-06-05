import { createMemo, createSignal, JSX, untrack } from "solid-js";
import { boolean, fallback, record } from "valibot";

import { createModal, GenericModal, ModalFooter, useModalContext } from ".";

import Persistent from "@renderer/stores/persistent";

const [trustedLinks, setTrustedLinks] = Persistent.registerStore("trustedLinks", fallback(record(boolean()), {}));

export function isTrustedLink(url: string): boolean {
	const u = new URL(url);
	return trustedLinks[u.hostname] || false;
}

export function openOutgoingLink(url: string): void {
	if (isTrustedLink(url)) return void window.open(url, "_blank");

	createModal({ content: () => <OutgoingLinkModal url={url} /> });
}

export function OutgoingLinkModal(props: { url: string }): JSX.Element {
	const hn = createMemo(() => new URL(props.url).hostname);
	// i dont know why the modal would open if the link is already whitelisted but whatever
	const [trusted, setTrusted] = createSignal(untrack(() => isTrustedLink(props.url)));
	const close = useModalContext();

	return (
		<GenericModal>
			<div class="outgoing-link-modal">
				<h2>Leaving Stryfe</h2>
				<p>The link is taking you to the following website</p>
				<div class="link-box">https://{hn()}/</div>
				<div onChange={() => setTrusted((p) => !p)}>
					<input type={"checkbox"} checked={trusted()} />
					<span>Trust {hn()} links from now on</span>
				</div>
			</div>
			<ModalFooter>
				<button onClick={close}>Go Back</button>
				<button
					onClick={() => {
						setTrustedLinks(hn(), trusted());
						close();
						window.open(props.url, "_blank");
					}}
				>
					Visit Site
				</button>
			</ModalFooter>
		</GenericModal>
	);
}
