import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

let connectionString = process.env.DATABASE_URL;

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

if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
	console.log("Dropping conflicting tables...");
	await sql`DROP TABLE IF EXISTS "user_stamp" CASCADE`;
	await sql`DROP TABLE IF EXISTS "stamp" CASCADE`;
	await sql`DROP TABLE IF EXISTS "mission_notification" CASCADE`;
	// We don't drop 'user' table to preserve user, but we might need to remove the column if migration fails on it.
	// However, usually adding a column is `ADD COLUMN IF NOT EXISTS` or checks?
	// Drizzle migration usually is `ALTER TABLE ... ADD COLUMN`.
	// If column exists, it might fail.
	// Let's try to verify if we need to drop column.
	try {
		await sql`ALTER TABLE "user" DROP COLUMN "total_duration"`;
	} catch {
		console.log(
			"Column total_duration might not exist or failed to drop, ignoring.",
		);
	}

	console.log("Tables dropped. Ready for migration.");
	process.exit(0);
}

main().catch(console.error);
