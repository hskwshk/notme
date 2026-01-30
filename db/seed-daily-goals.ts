import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import * as schema from "./schema";
import { dailyGoal } from "./schema";

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

const goals = [
	{
		title: "めっちゃ歩く人",
		imageUrl: "/images/goals/walking.png", // Placeholder
		description: "目安：30分以上",
		footer: "とにかくいっぱい歩く人！！！",
	},
	{
		title: "めっちゃ走る人",
		imageUrl: "/images/goals/running.png", // Placeholder
		description: "目安：5km以上",
		footer: "風のように走る！！！",
	},
	{
		title: "階段を使う人",
		imageUrl: "/images/goals/stairs.png", // Placeholder
		description: "目安：3階分",
		footer: "足腰を鍛えよう！！！",
	},
];

async function seed() {
	console.log("Seeding daily goals...");
	// Optional: Clear existing goals to avoid duplicates or valid collisions?
	// For now, just append. UUIDs avoid collision.

	// Check if goals already exist to avoid spamming if run multiple times
	const existing = await db.select().from(dailyGoal);
	if (existing.length > 0) {
		console.log("Goals already exist, skipping seed.");
		process.exit(0);
	}

	for (const goal of goals) {
		await db.insert(dailyGoal).values({
			id: uuidv7(),
			...goal,
		});
	}
	console.log("Seeding completed.");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
