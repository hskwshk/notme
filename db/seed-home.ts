import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import { activityLog, dailyQuote, user } from "./schema";

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
const db = drizzle(client);

async function seed() {
	console.log("Seeding home screen data...");

	// 1. Seed Quote
	const quote = {
		content: "運動せざる者、健康得るべからず。",
		author: "Unknown",
	};
	await db.insert(dailyQuote).values({ id: uuidv7(), ...quote });
	console.log("Seeded quote.");

	// 2. Get a user
	const users = await db.select().from(user).limit(1);
	if (users.length === 0) {
		console.log("No users found. Please sign up first.");
		process.exit(0);
	}
	const targetUser = users[0];

	// 3. Update User Stats
	await db
		.update(user)
		.set({
			level: 32,
			characterName: "なりきったキャラ",
			currentStreak: 18,
			maxStreak: 18,
			maxMinutes: 42,
		})
		.where(eq(user.id, targetUser.id));
	console.log("Updated user stats.");

	// 4. Seed Activity Logs
	// Create logs for last 30 days to populate graph
	const today = new Date();
	const logs = [];

	// Max/Month point (e.g. 15 days ago)
	const maxDate = new Date(today);
	maxDate.setDate(today.getDate() - 15);
	logs.push({
		date: maxDate.toISOString().split("T")[0],
		durationMinutes: 120,
	});

	// Recent days
	for (let i = 0; i < 3; i++) {
		const d = new Date(today);
		d.setDate(today.getDate() - i);
		logs.push({
			date: d.toISOString().split("T")[0],
			// Random minutes between 10 and 60
			durationMinutes: [30, 15, 10][i],
		});
	}

	for (const log of logs) {
		// Simple check to avoid duplicates for same day if re-run (though uuid prevents PK collision, logic might duplicate data)
		// For seed script, we just append or could delete first.
		// Let's just append for simplicity in this context.
		await db.insert(activityLog).values({
			id: uuidv7(),
			userId: targetUser.id,
			...log,
		});
	}
	console.log("Seeded activity logs.");

	console.log("Seeding completed.");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
