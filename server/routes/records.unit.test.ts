import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HonoEnv } from "@/server/types";
import recordsRoute from "./records";

describe("Records API (Unit)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Set Today to 2026-02-01 12:00:00
		vi.setSystemTime(new Date("2026-02-01T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("GET /today returns daily stats and sessions", async () => {
		const mockSessions = [
			{
				id: "s1",
				userId: "u1",
				startTime: new Date("2026-02-01T10:00:00Z"),
				durationSeconds: 1200, // 20 min
				createdAt: new Date(),
			},
			{
				id: "s2",
				userId: "u1",
				startTime: new Date("2026-02-01T11:00:00Z"),
				durationSeconds: 600, // 10 min
				createdAt: new Date(),
			},
		];

		const mockDb = {
			query: {
				activityLog: {
					findFirst: vi.fn().mockResolvedValue({ durationMinutes: 30 }),
				},
				exerciseSession: {
					findMany: vi.fn().mockResolvedValue(mockSessions),
				},
			},
		};

		const app = new Hono<HonoEnv>()
			.use("*", async (c, next) => {
				c.set("db", mockDb as unknown as HonoEnv["Variables"]["db"]);
				c.set("user", { id: "u1" } as unknown as HonoEnv["Variables"]["user"]);
				await next();
			})
			.route("/", recordsRoute);

		const res = await app.request("/today");
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json.totalDuration).toBe(30);
		expect(json.records).toHaveLength(2);
		expect(json.records[0].id).toBe("s1");
		expect(json.records[1].id).toBe("s2");
	});

	it("POST / creates a session and calculates startTime correctly", async () => {
		const mockTx = {
			query: {
				activityLog: {
					findFirst: vi.fn().mockResolvedValue(null), // No existing log
				},
			},
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockResolvedValue(undefined),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};

		const mockDb = {
			transaction: vi.fn().mockImplementation(async (callback) => {
				await callback(mockTx);
			}),
		};

		const app = new Hono<HonoEnv>()
			.use("*", async (c, next) => {
				c.set("db", mockDb as unknown as HonoEnv["Variables"]["db"]);
				c.set("user", { id: "u1" } as unknown as HonoEnv["Variables"]["user"]);
				await next();
			})
			.route("/", recordsRoute);

		// Input: 20 minutes (1200 seconds)
		// Current time (mocked): 12:00:00
		// Expected startTime: 11:40:00

		const res = await app.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ durationSeconds: 1200 }),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);

		expect(mockDb.transaction).toHaveBeenCalled();

		// Verify insert called with correct calculation
		expect(mockTx.insert).toHaveBeenCalledTimes(2); // session + activityLog

		// Check session insert
		// The first insert call should be session or activityLog depending on order.
		// In code: session first.
		// But vi.mock check is easier by checking mocked function calls.
		// Since I construct mockTx.insert().values(), I need to spy on .values() or inspect calls.
		// mockTx.insert returns mockTx itself.
		// So mockTx.values was called.

		// Let's inspect mockTx.values calls
		expect(mockTx.values).toHaveBeenCalledTimes(2);

		const sessionValues = mockTx.values.mock.calls[0][0];
		// Expect startTime to be 11:40
		expect(sessionValues.startTime).toEqual(new Date("2026-02-01T11:40:00Z"));
		expect(sessionValues.durationSeconds).toBe(1200);
	});

	it("DELETE /:id deletes session and updates aggregated stats", async () => {
		const mockSession = {
			id: "s1",
			userId: "u1",
			startTime: new Date("2026-02-01T10:00:00Z"),
			durationSeconds: 1200, // 20 min
		};

		const mockTx = {
			delete: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue(undefined),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
		};

		const mockDb = {
			query: {
				exerciseSession: {
					findFirst: vi.fn().mockResolvedValue(mockSession), // Return session to delete
				},
			},
			transaction: vi.fn().mockImplementation(async (callback) => {
				await callback(mockTx);
			}),
		};

		const app = new Hono<HonoEnv>()
			.use("*", async (c, next) => {
				c.set("db", mockDb as unknown as HonoEnv["Variables"]["db"]);
				c.set("user", { id: "u1" } as unknown as HonoEnv["Variables"]["user"]);
				await next();
			})
			.route("/", recordsRoute);

		const res = await app.request("/s1", {
			method: "DELETE",
		});

		expect(res.status).toBe(200);

		expect(mockDb.transaction).toHaveBeenCalled();
		expect(mockTx.delete).toHaveBeenCalled();
		expect(mockTx.update).toHaveBeenCalledTimes(2); // activityLog + user
	});
});
