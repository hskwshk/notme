import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { Hono } from "hono";

import postgres from "postgres"; // Import postgres correctly
import * as schema from "../db/schema";
import calendarRoute from "../server/routes/calendar";
import type { HonoEnv } from "../server/types"; // Adjust path

config({ path: ".env" });

async function main() {
	// 1. Setup DB Connection
	let connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not set");
	}
	if (connectionString?.includes("${")) {
		const {
			DATABASE_USER,
			DATABASE_PASSWORD,
			DATABASE_HOST,
			DATABASE_PORT,
			DATABASE_DB,
		} = process.env;
		connectionString = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_DB}`;
	}
	const client = postgres(connectionString, { prepare: false });
	const db = drizzle(client, { schema });

	// 2. Get User
	const users = await db.select().from(schema.user).limit(1);
	if (!users.length) {
		console.error("No user found");
		process.exit(1);
	}
	const user = users[0];
	console.log(`Verifying calendar for user: ${user.name} (${user.id})`);

	// 3. Create Hono App with Mocked Context
	const app = new Hono<HonoEnv>()
		.use(async (c, next) => {
			c.set("db", db);

			c.set("user", user);
			await next();
		})
		.route("/", calendarRoute);

	// 4. Request
	// Current month/year
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;

	console.log(`Fetching calendar for ${year}-${month}...`);
	const res = await app.request(`/?year=${year}&month=${month}`);

	if (res.status !== 200) {
		console.error("Error:", res.status, await res.text());
		process.exit(1);
	}

	const data = await res.json();

	// Pretty print the JSON
	console.log(JSON.stringify(data, null, 2));

	process.exit(0);
}

main().catch(console.error);
