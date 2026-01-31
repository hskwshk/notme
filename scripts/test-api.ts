import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../db/schema";

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

const BASE_URL = "http://localhost:3000/api";

async function runTest() {
	console.log("Setting up test data...");

	// 1. Ensure User
	let user = await db.query.user.findFirst();
	if (!user) {
		user = {
			id: uuidv4(),
			name: "Test User",
			email: "test@example.com",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			level: 1,
			currentStreak: 0,
			maxStreak: 0,
			maxMinutes: 0,
			totalDuration: 0,
			image: null,
			characterName: null,
		};
		await db.insert(schema.user).values(user);
		console.log("Created test user:", user.id);
	} else {
		console.log("Using existing user:", user.id);
	}

	// 2. Ensure Session
	let token: string;
	const session = await db.query.session.findFirst({
		where: eq(schema.session.userId, user.id),
	});

	if (session) {
		token = session.token;
		console.log("Using existing session:", session.id);
	} else {
		token = uuidv4();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 1);

		await db.insert(schema.session).values({
			id: uuidv4(),
			userId: user.id,
			token: token,
			expiresAt: expiresAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log("Created valid session token:", token);
	}

	// 3. Test GET /calendar
	// Note: Hono auth usually looks for cookie or header.
	// If using `better-auth`, it reads `session_token` cookie or Bearer token?
	// Let's try Bearer for simplicity or Cookie.

	const headers = {
		Cookie: `better-auth.session_token=${token}`,
		Authorization: `Bearer ${token}`,
	};

	console.log("Testing GET /calendar...");
	console.log("Using Token:", token);
	const res = await fetch(`${BASE_URL}/calendar`, { headers });
	if (res.status === 401) {
		console.error(
			"Auth failed. Middleware might require specific cookie name or setup.",
		);
		// Try to read header logic?
		// Assuming 'better-auth.session_token' is the cookie name.
	}
	const data = await res.json();
	console.log("GET Response:", JSON.stringify(data, null, 2));

	if (data.level !== undefined) {
		console.log("✅ Level field present:", data.level);
	} else {
		console.error("❌ Level field missing");
	}

	// 4. Test POST /calendar/gacha
	console.log("Testing POST /calendar/gacha...");
	const resGacha = await fetch(`${BASE_URL}/calendar/gacha`, {
		method: "POST",
		headers,
	});
	const gachaData = await resGacha.json();
	console.log("POST Response:", JSON.stringify(gachaData, null, 2));

	process.exit(0);
}

runTest().catch((e) => {
	console.error(e);
	process.exit(1);
});
