import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { activityLog } from "@/db/schema";
import type { HonoEnv } from "@/server/types";
import { setup } from "@/tests/vitest.helper";
import calendarRoute from "./calendar";

type CalendarResponse = {
	year: number;
	month: number;
	monthLabel: string;
	currentStreak: number;
	days: {
		date: string;
		day: number;
		isFuture: boolean;
		hasActivity: boolean;
		stamp: {
			type: string;
			label: string;
		} | null;
	}[];
};

const { createUser, db } = await setup();

describe("/routes/calendar", () => {
	it("returns 401 if not logged in", async () => {
		// Create app WITHOUT user in context
		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				c.set("user", null);
				await next();
			})
			.route("/", calendarRoute);

		const res = await app.request("/");
		expect(res.status).toBe(401);
	});

	it("returns calendar data for authenticated user", async () => {
		const testUser = await createUser();

		// Create app WITH user in context
		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				c.set("user", testUser);
				await next();
			})
			.route("/", calendarRoute);

		// Insert a test activity log for current month (or specific date)
		const testYear = 2024;
		const testMonth = 5; // May

		await db.insert(activityLog).values({
			id: "log_test_1",
			userId: testUser.id,
			date: "2024-05-15",
			durationMinutes: 65, // Should trigger "hard" / "めちゃ走った"
		});

		const res = await app.request(`/?year=${testYear}&month=${testMonth}`);
		expect(res.status).toBe(200);

		const json = (await res.json()) as CalendarResponse;

		expect(json.year).toBe(testYear);
		expect(json.month).toBe(testMonth);
		expect(json.monthLabel).toBe("5月");

		expect(json.days.length).toBe(31); // May has 31 days

		// Verify the specific day with activity
		const activeDay = json.days.find((d) => d.day === 15);
		if (!activeDay) throw new Error("Day 15 not found");
		expect(activeDay).toBeDefined();
		expect(activeDay.hasActivity).toBe(true);
		expect(activeDay.stamp).toEqual({
			type: "hard",
			label: "めちゃ走った",
		});

		// Verify a day without activity
		const emptyDay = json.days.find((d) => d.day === 16);
		if (!emptyDay) throw new Error("Day 16 not found");
		expect(emptyDay.hasActivity).toBe(false);
		expect(emptyDay.stamp).toBeNull();
	});
});
