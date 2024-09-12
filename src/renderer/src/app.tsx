import { HashRouter, Navigate, Route, useNavigate, useParams } from "@solidjs/router";
import { createSignal, JSX, lazy, Show } from "solid-js";

import MainView from "@components/mainview";
const Login = lazy(() => import("@components/login"));

import { FaSolidWindowMaximize, FaSolidWindowMinimize, FaSolidXmark } from "solid-icons/fa";

import appcss from "./app.css@sheet";
import { FocusAnimationDirective } from "./components/common/animationcontext";
import { mergeIntoSheet, ShadowCss } from "./components/common/shadowcss";
import globalSheet from "./global.css@sheet";
import Layers from "./modules/layers";
import { getToken } from "./modules/token";
import { setWindowTitle } from "./signals";

import hljsSheet from "highlight.js/styles/github-dark.min.css@sheet";
mergeIntoSheet(globalSheet, [hljsSheet]);

FocusAnimationDirective;

const [canEncrypt, setCanEncrypt] = createSignal(false);
window.ipc.isEncryptionAvailable().then(setCanEncrypt);

function NotFoundPage(): JSX.Element {
	const params = useParams(),
		navigate = useNavigate();

	setWindowTitle("404 - Stryfe");

	return (
		<div class="not-found">
			<h1>404</h1>
			<p>Page not found</p>
			<button onClick={(): void => navigate("/")}>Go back to /</button>
			<p>Path: {params.path}</p>
		</div>
	);
}

export default function App(): JSX.Element {
	const [t, st] = createSignal<string | null>(null);
	const [f, sf] = createSignal<boolean>(false);
	getToken().then((s) => {
		st(s);
		sf(true);
	});

	return (
		<ShadowCss css={appcss}>
			<div class={`app platform-${window.os_type.toLowerCase()}`} use:FocusAnimationDirective>
				<Show when={window.os_type.toLowerCase() === "windows"}>
					<div class="titlebar">
						<span class="titlebar-title">Stryfe</span>
						<div class="titlebar-buttons">
							<div class="titlebar-button minimize" onClick={(): void => void window.ipc.minimize()}>
								<FaSolidWindowMinimize size={14} />
							</div>
							<div class="titlebar-button maximize" onClick={(): void => void window.ipc.maximize()}>
								<FaSolidWindowMaximize size={14} />
							</div>
							<div class="titlebar-button close" onClick={(): void => void window.ipc.close()}>
								<FaSolidXmark size={18} />
							</div>
						</div>
					</div>
				</Show>
				<Show
					when={canEncrypt()}
					fallback={
						<div class="encryption-disabled">
							<h1>Encryption is not available</h1>
							<p>Please make sure you have an os keyring set up.</p>
						</div>
					}
				>
					<Layers />
					<div class="base">
						<Show when={f()}>
							<HashRouter>
								<Route path="/" component={(): JSX.Element => <Navigate href={t()?.length ? "/channels/@me" : "/login"} />} />
								<Route path="/login" component={Login} />
								<Route
									path="/channels/:guildId/:channelId?/:messageId?"
									component={MainView}
									matchFilters={{
										channelId: (id) => /^\d+$/.test(id),
										guildId: (id) => id === "@me" || /^\d+$/.test(id),
										messageId: (id) => /^\d+$/.test(id),
									}}
								/>
								<Route path={"/*path"} component={NotFoundPage} />
							</HashRouter>
						</Show>
					</div>
				</Show>
			</div>
		</ShadowCss>
	);
}
