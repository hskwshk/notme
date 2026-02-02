import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { activityLog, exerciseSession, user as userTable } from "@/db/schema";
import type { HonoEnv } from "@/server/types";

const recordsRoute = new Hono<HonoEnv>()
	.get("/today", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		const todayStr = today
			.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
			.replaceAll("/", "-");

		// Fetch daily aggregate
		const dailyLog = await db.query.activityLog.findFirst({
			where: and(
				eq(activityLog.userId, user.id),
				eq(activityLog.date, todayStr),
			),
		});

		// Fetch sessions
		const sessions = await db.query.exerciseSession.findMany({
			where: and(
				eq(exerciseSession.userId, user.id),
				gte(exerciseSession.startTime, startOfDay),
				lt(exerciseSession.startTime, endOfDay),
			),
			orderBy: desc(exerciseSession.startTime),
		});

		return c.json({
			totalDuration: dailyLog?.durationMinutes || 0,
			records: sessions.map((s) => ({
				id: s.id,
				startTime: s.startTime,
				durationSeconds: s.durationSeconds,
			})),
		});
	})
	.post(
		"/",
		zValidator(
			"json",
			z.object({
				durationSeconds: z.number().int().positive(),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const user = c.get("user");
			const { durationSeconds } = c.req.valid("json");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Calculate start time based on duration and current time (now)
			const now = new Date();
			const startTime = new Date(now.getTime() - durationSeconds * 1000);

			const newSessionId = uuidv4();

			// Transaction to update both session and daily log
			await db.transaction(async (tx) => {
				await tx.insert(exerciseSession).values({
					id: newSessionId,
					userId: user.id,
					startTime: startTime,
					durationSeconds: durationSeconds,
				});

				const todayStr = startTime
					.toLocaleDateString("ja-JP", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					})
					.replaceAll("/", "-");

				const minutes = Math.round(durationSeconds / 60);

				// Upsert activity log
				const existingLog = await tx.query.activityLog.findFirst({
					where: and(
						eq(activityLog.userId, user.id),
						eq(activityLog.date, todayStr),
					),
				});

				if (existingLog) {
					await tx
						.update(activityLog)
						.set({
							durationMinutes: sql`${activityLog.durationMinutes} + ${minutes}`,
						})
						.where(eq(activityLog.id, existingLog.id));
				} else {
					await tx.insert(activityLog).values({
						id: uuidv4(),
						userId: user.id,
						date: todayStr,
						durationMinutes: minutes,
					});
				}

				// Also update User total duration
				await tx
					.update(userTable)
					.set({
						totalDuration: sql`${userTable.totalDuration} + ${minutes}`,
					})
					.where(eq(userTable.id, user.id));
			});

			return c.json({ success: true, id: newSessionId });
		},
	)
	.delete("/:id", async (c) => {
		const db = c.get("db");
		const user = c.get("user");
		const id = c.req.param("id");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionToDelete = await db.query.exerciseSession.findFirst({
			where: and(
				eq(exerciseSession.id, id),
				eq(exerciseSession.userId, user.id),
			),
		});

		if (!sessionToDelete) {
			return c.json({ error: "Record not found" }, 404);
		}

		await db.transaction(async (tx) => {
			await tx.delete(exerciseSession).where(eq(exerciseSession.id, id));

			const minutes = Math.round(sessionToDelete.durationSeconds / 60);
			const todayStr = sessionToDelete.startTime
				.toLocaleDateString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				})
				.replaceAll("/", "-");

			// Decrease activity log
			await tx
				.update(activityLog)
				.set({
					durationMinutes: sql`GREATEST(0, ${activityLog.durationMinutes} - ${minutes})`,
				})
				.where(
					and(eq(activityLog.userId, user.id), eq(activityLog.date, todayStr)),
				);

			// Decrease User total duration
			await tx
				.update(userTable)
				.set({
					totalDuration: sql`GREATEST(0, ${userTable.totalDuration} - ${minutes})`,
				})
				.where(eq(userTable.id, user.id));
		});

		return c.json({ success: true });
	});

export default recordsRoute;
