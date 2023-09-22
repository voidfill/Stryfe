import { useNavigate } from "@solidjs/router";
import { createSignal, JSX } from "solid-js";

import { setToken } from "@renderer/modules/token";

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
