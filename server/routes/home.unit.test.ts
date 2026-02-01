import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HonoEnv } from "@/server/types";
import homeRoute from "./home";

describe("GET / (Unit)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Set Today to 2026-01-10
		vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns correct graph data with 5 days history and max highlight", async () => {
		// Mock DB
		const mockDb = {
			query: {
				user: {
					findFirst: vi.fn().mockResolvedValue({
						name: "Test User",
						image: "img",
						characterName: "Char",
						level: 1,
						currentStreak: 1,
						maxStreak: 1,
						maxMinutes: 1000,
					}),
				},
				activityLog: {
					findFirst: vi.fn().mockResolvedValue({ durationMinutes: 30 }),
				},
				dailyQuote: {
					findFirst: vi.fn().mockResolvedValue({ content: "Quote" }),
				},
			},
			$count: vi.fn().mockResolvedValue(0),
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				// Mock logs from DB query (recentLogs)
				// Note: The code logic fetches last 30 days.
				{ date: "2026-01-10", durationMinutes: 30 }, // Today
				{ date: "2026-01-09", durationMinutes: 60 }, // Yesterday (Max 5 days)
				{ date: "2026-01-08", durationMinutes: 0 },
				{ date: "2026-01-07", durationMinutes: 0 },
				{ date: "2026-01-06", durationMinutes: 10 }, // 4 days ago
				{ date: "2025-12-15", durationMinutes: 100 }, // Old log (Month max)
			]),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
		};

		const app = new Hono<HonoEnv>()
			.use("*", async (c, next) => {
				c.set("db", mockDb as unknown as HonoEnv["Variables"]["db"]);
				c.set("user", { id: "u1" } as unknown as HonoEnv["Variables"]["user"]);
				await next();
			})
			.route("/", homeRoute);

		const res = await app.request("/");

		expect(res.status).toBe(200);
		const json = (await res.json()) as {
			stats: {
				monthMaxMinutes: number;
				graphData: {
					label: string;
					minutes: number;
					isMostEffort: boolean;
					type: string;
				}[];
			};
		};

		// Month max - should be 100 from the logs list
		expect(json.stats.monthMaxMinutes).toBe(100);

		const graphData = json.stats.graphData;
		expect(graphData).toHaveLength(5);

		// 4 days ago: 2026-01-06 -> 10m
		expect(graphData[0]).toMatchObject({
			label: "4日前",
			minutes: 10,
			isMostEffort: false,
		});

		// 3 days ago: 2026-01-07 -> 0m
		expect(graphData[1].minutes).toBe(0);

		// 2 days ago: 2026-01-08 -> 0m
		expect(graphData[2].minutes).toBe(0);

		// Yesterday: 2026-01-09 -> 60m (Max)
		expect(graphData[3]).toMatchObject({
			label: "昨日",
			minutes: 60,
			isMostEffort: true,
		});

		// Today: 2026-01-10 -> 30m
		expect(graphData[4]).toMatchObject({
			label: "今日",
			minutes: 30,
			isMostEffort: false,
		});
	});
});
