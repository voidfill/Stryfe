/// <reference types="vite/client" />

type PickByType<T, Value> = {
	[P in keyof T as T[P] extends Value | undefined ? P : never]: T[P];
};

type OmitByType<T, Value> = {
	[P in keyof T as T[P] extends Value ? never : P]: T[P];
};
