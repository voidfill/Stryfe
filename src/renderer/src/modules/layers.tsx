import { For, JSX } from "solid-js";
import { ParentComponent } from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";

export type Layer = ParentComponent<{ close: () => void }>;

const [layers, setLayers] = createStore<[number, Layer][]>([]);

let layerId = 0;

export default function Layers(): JSX.Element {
	return (
		<Portal>
			<For each={layers}>{([lid, Layer]): JSX.Element => <Layer close={/* @once */ (): void => removeLayer(lid)} />}</For>
		</Portal>
	);
}

export function removeLayer(id: number): void {
	setLayers((layers) => layers.filter((layer) => layer[0] !== id));
}

export function addLayer(layer: Layer): number {
	const lid = layerId++;
	setLayers((layers) => [...layers, [lid, layer]]);
	return lid;
}
