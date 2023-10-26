import { array, boolean, nullable, object, string } from "valibot";

export default object({
	animated: boolean(),
	available: boolean(),
	id: string(),
	managed: boolean(),
	name: string(),
	require_colons: boolean(),
	roles: nullable(array(string())),
});
