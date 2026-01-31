import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import * as schema from "./schema";

config({ path: ".env" });

const STAMPS = [
	{ name: "Walk Cat", imageUrl: "/stamps/cat_walk.png" },
	{ name: "Run Cat", imageUrl: "/stamps/cat_run.png" },
	{ name: "Sleep Cat", imageUrl: "/stamps/cat_sleep.png" },
	{ name: "Eat Cat", imageUrl: "/stamps/cat_eat.png" },
	{ name: "Study Cat", imageUrl: "/stamps/cat_study.png" },
];

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

async function seedStamps() {
	console.log("Seeding stamps...");

	for (const s of STAMPS) {
		const existing = await db.query.stamp.findFirst({
			where: (table, { eq }) => eq(table.name, s.name),
		});

		if (!existing) {
			await db.insert(schema.stamp).values({
				id: uuidv4(),
				name: s.name,
				imageUrl: s.imageUrl,
			});
			console.log(`Added stamp: ${s.name}`);
		} else {
			console.log(`Skipped existing stamp: ${s.name}`);
		}
	}

	console.log("Stamps seeded!");
	process.exit(0);
}

seedStamps().catch((err) => {
	console.error(err);
	process.exit(1);
});
