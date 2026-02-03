import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const dbUrl = "postgresql://local:1234@localhost:5432/local";

console.log("Connecting to:", dbUrl);

const client = postgres(dbUrl);
const db = drizzle(client, { schema });

async function main() {
	console.log("Checking users in DB...");
	try {
		const users = await db.query.user.findMany();
		console.log(`Found ${users.length} users:`);
		users.forEach((u) => {
			console.log(
				`- ID: ${u.id}, Name: ${u.name}, Username: ${u.username}, Email: ${u.email}, CreatedAt: ${u.createdAt}`,
			);
		});

		const authClient = await db.query.account.findMany();
		console.log(`Found ${authClient.length} accounts.`);

		// Also check if any sessions exist
		const sessions = await db.query.session.findMany();
		console.log(`Found ${sessions.length} sessions.`);
	} catch (e) {
		console.error("Error querying DB:", e);
	} finally {
		await client.end();
	}
}

main();
