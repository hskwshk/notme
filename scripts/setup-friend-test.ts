/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../db/schema";

const dbUrl =
	process.env.DATABASE_URL || "postgresql://local:1234@localhost:5432/local";
const client = postgres(dbUrl);
const db = drizzle(client, { schema });

// IDs from previous check
const TEST_USER_ID = "019c102d-068a-7d12-aad4-db10304c46fb";
const SHOKI_ID = "UPsacHM5DRgnvyNQnMMd35vSFUApwQ49";

async function main() {
	console.log("Setting up friendship and activity...");

	// 1. Establish Friendship (Accepted)
	// Check if exists
	const existing = await db.query.friendship.findFirst({
		where: or(
			and(
				eq(schema.friendship.userId, TEST_USER_ID),
				eq(schema.friendship.friendId, SHOKI_ID),
			),
			and(
				eq(schema.friendship.userId, SHOKI_ID),
				eq(schema.friendship.friendId, TEST_USER_ID),
			),
		),
	});

	if (existing) {
		console.log("Friendship already exists. Updating to accepted.");
		await db
			.update(schema.friendship)
			.set({ status: "accepted" })
			.where(eq(schema.friendship.id, existing.id));
	} else {
		console.log("Creating new friendship (Test User -> Shoki)...");
		await db.insert(schema.friendship).values({
			id: uuidv4(),
			userId: TEST_USER_ID,
			friendId: SHOKI_ID,
			status: "accepted",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	// 2. Generate Dummy Activity for Test User (Last 7 days)
	console.log("Generating dummy activity data for Test User...");
	const today = new Date();

	// Clear existing logs for Test User to avoid dupes/mess
	await db
		.delete(schema.activityLog)
		.where(eq(schema.activityLog.userId, TEST_USER_ID));

	for (let i = 0; i < 7; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split("T")[0];

		// Random minutes between 0 and 60
		const minutes = Math.floor(Math.random() * 60);

		if (minutes > 0) {
			await db.insert(schema.activityLog).values({
				id: uuidv4(),
				userId: TEST_USER_ID,
				date: dateStr,
				durationMinutes: minutes,
				isStampViewed: true,
				createdAt: new Date(),
			} as any);
			console.log(`- ${dateStr}: ${minutes} min`);
		}
	}

	// Update Test User stats
	await db
		.update(schema.user)
		.set({
			level: 5,
			currentStreak: 3,
			maxStreak: 10,
			characterName: "熱血テストマン",
		} as any)
		.where(eq(schema.user.id, TEST_USER_ID));

	console.log("Setup complete!");
}

main()
	.catch(console.error)
	.finally(() => client.end());
