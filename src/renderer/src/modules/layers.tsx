import { For, JSX } from "solid-js";
import { ParentComponent } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Portal } from "solid-js/web";

import logger from "./logger";

export type Layer = ParentComponent<{ close: () => void }>;

const [layers, setLayers] = createStore<[number, Layer][]>([]);

let layerId = 0;

export default function Layers(): JSX.Element {
	return (
		<Portal useShadow>
			<For each={layers}>{([lid, Layer]): JSX.Element => <Layer close={/* @once */ (): void => removeLayer(lid)} />}</For>
		</Portal>
	);
}

export function removeLayer(id: number): void {
	setLayers(
		produce((layers) => {
			const index = layers.findIndex(([lid]) => lid === id);
			if (!~index) return void logger.warn("Didnt find layer to remove, id: ", id);
			layers.splice(index, 1);
		}),
	);
}

export function addLayer(layer: Layer): number {
	const lid = layerId++;
	setLayers(produce((layers) => layers.push([lid, layer])));
	return lid;
}
