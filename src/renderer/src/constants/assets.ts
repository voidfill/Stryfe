const data = import.meta.compileTime("./assets_ct.ts") as {
	avatars: string[];
	groupIcons: string[];
};

export default data;
