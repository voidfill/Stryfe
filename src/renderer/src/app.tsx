import { Routes, Route, Navigate, useParams, useNavigate } from "@solidjs/router";
import Storage from "@modules/storage";
import { JSX, Show, createSignal, lazy } from "solid-js";

import MainView from "@components/mainview";
const Login = lazy(() => import("@components/login"));

import "./app.scss";
import { FocusAnimationProvider } from "./components/common/animationcontext";

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
		<FocusAnimationProvider component={"div"} class={`app platform-${window.os_type}`}>
			<Show
				when={canEncrypt()}
				fallback={
					<div class="encryption-disabled">
						<h1>Encryption is not available</h1>
						<p>Please make sure you have an os keyring set up.</p>
					</div>
				}
			>
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
		</FocusAnimationProvider>
	);
}
