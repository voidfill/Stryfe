import { createMemo, JSX, Show } from "solid-js";

import { clanIconURL } from "@constants/images";

import { getClan } from "@stores/users";

import badgecss from "./clanbadge.css@sheet";
import { ShadowCss } from "./shadowcss";

export default function clanBadge(props: { clickable?: boolean; userId: string }): JSX.Element {
	const clan = createMemo(() => getClan(props.userId));

	return (
		<ShadowCss css={badgecss} as="span">
			<Show when={clan()}>
				{(c) => (
					<span
						classList={{ "clan-badge": true, clickable: props.clickable }}
						onClick={() => {
							if (!props.clickable) return;
						}}
					>
						<img src={clanIconURL(c().guild_id, c().badge, 16)} alt={c().tag} />
						<span class="clan-tag">{c().tag}</span>
					</span>
				)}
			</Show>
		</ShadowCss>
	);
}
