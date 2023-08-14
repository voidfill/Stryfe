import { JSX, createSignal } from "solid-js";

import { setToken } from "@renderer/modules/token";
import { useNavigate } from "@solidjs/router";

export default function Token(): JSX.Element {
	const [t, st] = createSignal("");
	const navigate = useNavigate();

	return (
		<div>
			<input value={t()} onInput={(e): void => void st(e.target.value)} />
			<button
				onClick={(): void => {
					setToken(t());
					navigate("/");
				}}
			>
				Submit
			</button>
		</div>
	);
}
