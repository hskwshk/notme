import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import * as schema from "./schema";

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

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
	console.log("Seeding calendar data...");

	// 1. Get a user
	const users = await db.select().from(schema.user).limit(1);
	if (users.length === 0) {
		console.log("No users found. Please sign up first.");
		process.exit(0);
	}
	const targetUser = users[0];

	// 2. Populate current month with varied activity
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth(); // 0-indexed

	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const logs = [];

	for (let d = 1; d <= daysInMonth; d++) {
		// Randomly skip some days to create gaps
		if (Math.random() < 0.3) continue;

		const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

		// Varied duration for different stamps
		// < 30 : light
		// 30-60 : medium
		// > 60 : hard
		const r = Math.random();
		let duration = 0;
		if (r < 0.4) duration = 20;
		else if (r < 0.8) duration = 45;
		else duration = 90;

		logs.push({
			date: dateStr,
			durationMinutes: duration,
		});
	}

	for (const log of logs) {
		// Check if exists first to prevent massive duplicate pileup
		const existing = await db.query.activityLog.findFirst({
			where: (l, { and, eq }) =>
				and(eq(l.userId, targetUser.id), eq(l.date, log.date)),
		});

		if (!existing) {
			await db.insert(schema.activityLog).values({
				id: uuidv7(),
				userId: targetUser.id,
				...log,
			});
			process.stdout.write(".");
		}
	}
	console.log("\nSeeded calendar activity logs.");
	console.log("Seeding completed.");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
