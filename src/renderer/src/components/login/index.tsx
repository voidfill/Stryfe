import { createSignal, For, JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { ShadowCss } from "../common/shadowcss";
import Credentials from "./credentials";
import QRCode from "./qrcode";
import logincss from "./style.css@sheet";
import Token from "./token";

import { setWindowTitle } from "@renderer/signals";

const items = [
	{
		component: Credentials,
		name: "Credentials",
	},
	{
		component: Token,
		name: "Token",
	},
	{
		component: QRCode,
		name: "QR Code",
	},
];

export default function Login(): JSX.Element {
	const [selected, setSelected] = createSignal(0);

	setWindowTitle("Login - Stryfe");

	return (
		<ShadowCss css={logincss}>
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
		</ShadowCss>
	);
}
