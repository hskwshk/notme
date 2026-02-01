import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { HonoEnv } from "@/server/types";
import { setup } from "@/tests/vitest.helper";
import { activityLog, friendship, stamp, userStamp } from "../../db/schema";
import userRoute from "./user";

const { createUser, db } = await setup();

describe("GET /me/profile", () => {
	it("returns correct user stats and social counts", async () => {
		const userMe = await createUser({
			id: "me_profile",
			name: "Me",
			currentStreak: 5,
			maxMinutes: 60,
		});
		const userB = await createUser({ id: "user_b" });
		const userC = await createUser({ id: "user_c" });
		const userD = await createUser({ id: "user_d" });

		// 1. Following: Me -> B (Accepted)
		await db.insert(friendship).values({
			id: "f1",
			userId: userMe.id,
			friendId: userB.id,
			status: "accepted",
		});

		// 2. Follower: C -> Me (Accepted)
		await db.insert(friendship).values({
			id: "f2",
			userId: userC.id,
			friendId: userMe.id,
			status: "accepted",
		});

		// 3. Request: D -> Me (Pending)
		await db.insert(friendship).values({
			id: "f3",
			userId: userD.id,
			friendId: userMe.id,
			status: "pending",
		});

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// @ts-expect-error: Mock user type mismatch
				c.set("user", userMe);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/me/profile");
		expect(res.status).toBe(200);
		const json = await res.json();

		// Check User Stats
		expect(json.user.id).toBe(userMe.id);
		expect(json.user.currentStreak).toBe(5);
		expect(json.user.maxMinutes).toBe(60);

		// Check Social Counts
		expect(json.stats.followingCount).toBe(1);
		expect(json.stats.followerCount).toBe(1);
		expect(json.stats.requestCount).toBe(1);
	});

	it("returns set favorite stamps in correct order", async () => {
		const userMe = await createUser({ id: "me_stamps" });

		// Create Stamps
		await db.insert(stamp).values([
			{ id: "s1", name: "Stamp 1", imageUrl: "url1" },
			{ id: "s2", name: "Stamp 2", imageUrl: "url2" },
			{ id: "s3", name: "Stamp 3", imageUrl: "url3" },
			{ id: "s4", name: "Stamp 4", imageUrl: "url4" },
		]);

		// Give Stamps to User
		await db.insert(userStamp).values([
			{
				id: "us1",
				userId: userMe.id,
				stampId: "s1",
				isFavorite: true,
				favoriteOrder: 2,
			},
			{
				id: "us2",
				userId: userMe.id,
				stampId: "s2",
				isFavorite: false,
			},
			{
				id: "us3",
				userId: userMe.id,
				stampId: "s3",
				isFavorite: true,
				favoriteOrder: 1,
			},
			{
				id: "us4",
				userId: userMe.id,
				stampId: "s4",
				isFavorite: false,
			},
		]);

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// @ts-expect-error: Mock user type mismatch
				c.set("user", userMe);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/me/profile");
		const json = await res.json();

		expect(json.favoriteStamps).toHaveLength(2);
		// Order should be s3 (order 1), s1 (order 2)
		expect(json.favoriteStamps[0].id).toBe("s3");
		expect(json.favoriteStamps[1].id).toBe("s1");
	});

	it("updates favorite stamps", async () => {
		const userMe = await createUser({ id: "me_update_stamps" });
		await db.insert(stamp).values([
			{ id: "s1", name: "S1", imageUrl: "u1" },
			{ id: "s2", name: "S2", imageUrl: "u2" },
			{ id: "s3", name: "S3", imageUrl: "u3" },
		]);
		await db.insert(userStamp).values([
			{ id: "us1", userId: userMe.id, stampId: "s1" },
			{ id: "us2", userId: userMe.id, stampId: "s2" },
			{ id: "us3", userId: userMe.id, stampId: "s3" },
		]);

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// @ts-expect-error: Mock user type mismatch
				c.set("user", userMe);
				await next();
			})
			.route("/", userRoute);

		// Set s1 and s3 as favorites
		const res = await app.request("/me/profile/favorite-stamps", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ stampIds: ["s3", "s1"] }),
		});

		expect(res.status).toBe(200);

		// Verify via GET
		const getRes = await app.request("/me/profile");
		const json = await getRes.json();
		expect(json.favoriteStamps).toHaveLength(2);
		expect(json.favoriteStamps[0].id).toBe("s3");
		expect(json.favoriteStamps[1].id).toBe("s1");
	});

	it("returns correct graph data", async () => {
		const userMe = await createUser({ id: "me_graph" });

		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const twoDaysAgo = new Date(today);
		twoDaysAgo.setDate(today.getDate() - 2);

		const todayStr = today.toISOString().split("T")[0];
		const yesterdayStr = yesterday.toISOString().split("T")[0];
		const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

		await db.insert(activityLog).values([
			{ id: "l1", userId: userMe.id, date: twoDaysAgoStr, durationMinutes: 30 },
			{ id: "l2", userId: userMe.id, date: yesterdayStr, durationMinutes: 60 }, // Max
			{ id: "l3", userId: userMe.id, date: todayStr, durationMinutes: 10 },
		]);

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// @ts-expect-error: Mock user type mismatch
				c.set("user", userMe);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/me/profile");
		const json = await res.json();

		expect(json.graph).toHaveLength(7);

		// Find logs in graph
		const g2 = json.graph.find(
			(g: { date: string }) => g.date === twoDaysAgoStr,
		);
		const g1 = json.graph.find(
			(g: { date: string }) => g.date === yesterdayStr,
		);
		const g0 = json.graph.find((g: { date: string }) => g.date === todayStr);

		expect(g2.minutes).toBe(30);
		expect(g1.minutes).toBe(60);
		expect(g0.minutes).toBe(10);

		expect(g2.isMax).toBe(false);
		expect(g1.isMax).toBe(true);
		expect(g0.isMax).toBe(false);
	});
});
