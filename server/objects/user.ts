import { z } from "zod";

export const usernameSchema = z
	.string()
	.min(1)
	.regex(
		/^(?!.*\.\.)[a-zA-Z0-9_](?:[a-zA-Z0-9_.]*[a-zA-Z0-9_])?$/,
		"Only letters, numbers, underscores and dots allowed (no consecutive dots, cannot start/end with dot)",
	);

export const passwordSchema = z
	.string()
	.min(8)
	.regex(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric");
