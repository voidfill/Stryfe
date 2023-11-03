import { user } from "../common";

import { array, boolean, nullable, object, optional, string } from "valibot";

export default object({
	animated: optional(boolean()),
	available: optional(boolean()),
	id: string(),
	managed: boolean(),
	name: string(),
	require_colons: boolean(),
	roles: nullable(array(string())),
	user: optional(user),
});
