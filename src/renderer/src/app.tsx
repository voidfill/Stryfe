import { Navigate, Route, Routes, useNavigate, useParams } from "@solidjs/router";
import { createSignal, JSX, lazy, Show } from "solid-js";

import Storage from "@modules/storage";

import MainView from "@components/mainview";
const Login = lazy(() => import("@components/login"));

import { FocusAnimationDirective } from "./components/common/animationcontext";
import Layers from "./modules/layers";

import "./app.scss";

FocusAnimationDirective;

const [canEncrypt, setCanEncrypt] = createSignal(false);
window.ipc.isEncryptionAvailable().then(setCanEncrypt);

function NotFoundPage(): JSX.Element {
	const params = useParams(),
		navigate = useNavigate();

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
	return (
		<div class={`app platform-${window.os_type}`} use:FocusAnimationDirective>
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
					<Routes>
						<Route path="/" element={<Navigate href={Storage.has("token") ? "/channels/@me" : "/login"} />} />
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
					</Routes>
				</div>
			</Show>
		</div>
	);
}
