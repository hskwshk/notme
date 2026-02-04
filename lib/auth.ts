import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import * as schema from "@/db/schema";
import { db } from "@/lib/db";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://10.96.1.64:3000",
	],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Optional: based on requirements
	},
	plugins: [username()],
});
