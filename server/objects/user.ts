import { z } from "zod";

export const usernameSchema = z
	.string()
	.min(1)
	.regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed");

export const passwordSchema = z
	.string()
	.min(8)
	.regex(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric");
