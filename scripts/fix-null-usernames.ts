import "dotenv/config";
import postgres from "postgres";

async function main() {
	let connectionString = process.env.DATABASE_URL;

	// Handle variable expansion manually if needed, or construct from parts
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

	const sql = postgres(connectionString, { prepare: false });

	console.log("Checking for users with null usernames...");

	// Raw SQL update
	const result = await sql`
        UPDATE "user"
        SET "username" = 'user_' || "id"
        WHERE "username" IS NULL
    `;

	console.log(`Updated ${result.count} users.`);

	await sql.end();
}

main().catch(console.error);
