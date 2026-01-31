import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import * as schema from "../db/schema";

config({ path: ".env" });

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

async function getToken() {
	// Get the first user
	const users = await db.select().from(schema.user).limit(1);
	if (!users.length) {
		console.log("NO_USER");
		process.exit(0);
	}
	const user = users[0];

	// Get a session for this user
	const sessions = await db
		.select()
		.from(schema.session)
		.where(eq(schema.session.userId, user.id))
		.limit(1);

	if (sessions.length) {
		console.log(sessions[0].token);
	} else {
		// Create a fake session
		const newToken = `generated_token_${Math.random().toString(36).substring(7)}`;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 1);

		await db.insert(schema.session).values({
			id: uuidv7(),
			userId: user.id,
			token: newToken,
			expiresAt: expiresAt,
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: "127.0.0.1",
			userAgent: "script",
		});
		console.log(newToken);
	}
	process.exit(0);
}

getToken();
