import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { dailyGoal, userDailyGoal } from "@/db/schema";
import type { HonoEnv } from "@/server/types";

const dailyGoalRoute = new Hono<HonoEnv>()
	.get("/", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const today = new Date()
			.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
			.replaceAll("/", "-");

		// Check if user already has a goal for today
		const existingUserGoal = await db.query.userDailyGoal.findFirst({
			where: and(
				eq(userDailyGoal.userId, user.id),
				eq(userDailyGoal.date, today),
			),
			with: {
				goal: true,
			},
		});

		if (existingUserGoal) {
			return c.json({
				...existingUserGoal.goal,
				isViewed: existingUserGoal.isViewed,
			});
		}

		// Assign a random goal
		const allGoals = await db.select().from(dailyGoal);

		if (allGoals.length === 0) {
			console.error("No daily goals found in master table.");
			return c.json({ error: "No goals available" }, 500);
		}

		const randomGoal = allGoals[Math.floor(Math.random() * allGoals.length)];

		await db.insert(userDailyGoal).values({
			id: uuidv7(),
			userId: user.id,
			goalId: randomGoal.id,
			date: today,
			isViewed: false,
		});

		return c.json({
			...randomGoal,
			isViewed: false,
		});
	})
	.patch(
		"/:id/viewed",
		zValidator("param", z.object({ id: z.string() })),
		async (c) => {
			const db = c.get("db");
			const user = c.get("user");
			const goalId = c.req.param("id");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const today = new Date()
				.toLocaleDateString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				})
				.replaceAll("/", "-");

			await db
				.update(userDailyGoal)
				.set({ isViewed: true })
				.where(
					and(
						eq(userDailyGoal.userId, user.id),
						eq(userDailyGoal.goalId, goalId),
						eq(userDailyGoal.date, today),
					),
				);

			return c.json({ success: true });
		},
	);

export default dailyGoalRoute;
