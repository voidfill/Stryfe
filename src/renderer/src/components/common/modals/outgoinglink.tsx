import { createMemo, createSignal, JSX, Show, untrack } from "solid-js";
import { boolean, fallback, record } from "valibot";

import { createModal, GenericModal, ModalFooter, useModalContext } from ".";

import Persistent from "@renderer/stores/persistent";

const [trustedLinks, setTrustedLinks] = Persistent.registerStore("trustedLinks", fallback(record(boolean()), {}));

export function isTrustedLink(url: string): boolean {
	const u = new URL(url);
	if (!u.hostname) return false;
	return trustedLinks[u.hostname] || false;
}

export function openOutgoingLink(url: string): void {
	if (isTrustedLink(url)) return void window.open(url, "_blank");

	createModal({ content: () => <OutgoingLinkModal url={url} /> });
}

export function OutgoingLink(props: { url: string }): JSX.Element {
	return (
		<span class="outgoing-link-item" onClick={() => openOutgoingLink(props.url)}>
			{props.url}
		</span>
	);
}

export function OutgoingLinkModal(props: { url: string }): JSX.Element {
	const u = createMemo(() => new URL(props.url));
	// i dont know why the modal would open if the link is already whitelisted but whatever
	const [trusted, setTrusted] = createSignal(untrack(() => isTrustedLink(props.url)));
	const close = useModalContext();

	return (
		<GenericModal class="outgoing-link-modal">
			<div class="content">
				<span class="title">Leaving Stryfe</span>
				<span class="description">This link is taking you to the following website</span>
				<span class="link-box">
					<Show when={u().hostname.length} fallback={props.url}>
						<span>{u().protocol}//</span>
						<span class="url-hostname">{u().hostname}</span>
						<span>{u().port ? `:${u().port}` : ""}</span>
						<span>{u().pathname}</span>
						<span>{u().search}</span>
					</Show>
				</span>
				<Show when={u().hostname}>
					<div onClick={() => setTrusted((p) => !p)} class="trust-box">
						<input type={"checkbox"} checked={trusted()} />
						<span>
							Trust
							<span class="url-hostname"> {u().hostname} </span>
							links from now on
						</span>
					</div>
				</Show>
			</div>
			<ModalFooter>
				<button onClick={close}>Go Back</button>
				<button
					onClick={() => {
						if (u().hostname) setTrustedLinks(u().hostname, trusted());
						window.open(props.url, "_blank");
						close();
					}}
				>
					Visit Site
				</button>
			</ModalFooter>
		</GenericModal>
	);
}
