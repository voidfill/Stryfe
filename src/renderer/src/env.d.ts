/// <reference types="vite/client" />

type PickByType<T, Value> = {
	[P in keyof T as T[P] extends Value | undefined ? P : never]: T[P];
};

type OmitByType<T, Value> = {
	[P in keyof T as T[P] extends Value ? never : P]: T[P];
};

// eslint-disable-next-line @typescript-eslint/ban-types
type DistributiveOmit<T, K extends PropertyKey> = T extends any ? Omit<T, K> : never;

type Prettify<T> = {
	[K in keyof T]: T[K];
	// eslint-disable-next-line
} & {};
