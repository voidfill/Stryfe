import { createSignal, For, JSX, lazy } from "solid-js";
import { Dynamic } from "solid-js/web";

const items = [
	{
		component: lazy(() => import("./credentials")),
		name: "Credentials",
	},
	{
		component: lazy(() => import("./token")),
		name: "Token",
	},
	{
		component: lazy(() => import("./qrcode")),
		name: "QR Code",
	},
];

export default function Login(): JSX.Element {
	const [selected, setSelected] = createSignal(0);

	return (
		<div class="login-page">
			<div class="login-box">
				<div class="login-box-header">
					<For each={items}>
						{({ name }, i): JSX.Element => (
							<button
								onClick={(): void => void setSelected(i())}
								classList={{
									selected: selected() === i(),
								}}
							>
								{name}
							</button>
						)}
					</For>
				</div>
				<div class="login-box-content">
					<Dynamic component={items[selected()].component} />
				</div>
			</div>
		</div>
	);
}
