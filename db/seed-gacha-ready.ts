import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 } from "uuid";
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
	console.log("Seeding gacha ready data...");

	// 1. Get a user
	const users = await db.select().from(schema.user).limit(1);
	if (users.length === 0) {
		console.log("No users found. Please sign up first.");
		process.exit(0);
	}
	const targetUser = users[0];
	console.log(`Targeting user: ${targetUser.name} (Level ${targetUser.level})`);

	// Reset User Level to 1 for consistent testing
	await db
		.update(schema.user)
		.set({ level: 1 })
		.where(eq(schema.user.id, targetUser.id));
	console.log("Reset user level to 1.");

	// Clear existing mission notifications to start fresh
	await db
		.delete(schema.missionNotification)
		.where(eq(schema.missionNotification.userId, targetUser.id));

	// 2. Insert 3 Completed Missions (Requirement for Lv.1 -> Lv.2 is 3 missions)
	const missions = [
		{ type: "squat", title: "Wait, these are not real fields but okay" },
		{ type: "stretch", title: "Just filling count" },
		{ type: "plank", title: "Just filling count" },
	];

	for (const m of missions) {
		await db.insert(schema.missionNotification).values({
			id: v4(),
			userId: targetUser.id,
			missionType: m.type,
			isCompleted: true,
			completedAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
		});
	}

	console.log(`Inserted ${missions.length} completed missions.`);
	console.log("User should now be ready to level up!");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
