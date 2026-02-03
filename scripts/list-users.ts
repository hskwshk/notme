import "dotenv/config";
import { user } from "../db/schema";
import { db } from "../lib/db";

async function main() {
	const users = await db.select().from(user);
	console.log(
		"Users found:",
		users.map((u) => ({ id: u.id, name: u.name })),
	);
	process.exit(0);
}

main();
