import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, JSX } from "solid-js";

import { isValidToken, setToken } from "@renderer/modules/token";

export default function Token(): JSX.Element {
	const navigate = useNavigate();
	const [t, st] = createSignal("");
	const valid = createMemo(() => isValidToken(t()));

	return (
		<div>
			<input value={t()} onInput={(e): void => void st(e.target.value)} />
			<button
				onClick={(): void => {
					if (!valid()) return;
					setToken(t());
					navigate("/");
				}}
				disabled={!valid()}
			>
				Submit
			</button>
		</div>
	);
}
