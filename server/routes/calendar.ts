import { and, count, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import {
	activityLog,
	missionNotification,
	userStamp,
	user as userTable,
} from "@/db/schema";
import { calculateStampFromLog } from "@/server/objects/stamp";
import type { HonoEnv } from "@/server/types";

// Helper to calculate required missions for next level
const getRequiredMissions = (level: number) => {
	return level * 5;
};

const calendarRoute = new Hono<HonoEnv>()
	.get("/", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Parsing query params for year/month (default to now)
		const now = new Date();
		const yearQuery = c.req.query("year");
		const monthQuery = c.req.query("month");

		const year = yearQuery ? parseInt(yearQuery, 10) : now.getFullYear();
		const month = monthQuery ? parseInt(monthQuery, 10) : now.getMonth() + 1; // 1-12

		// Construct date range for the month
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const startDateStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
		const endDateStr = endDate.toISOString().split("T")[0];

		// 1. Fetch User Info & Stats
		const userData = await db.query.user.findFirst({
			where: eq(userTable.id, user.id),
			with: {
				userStamps: true,
			},
		});

		if (!userData) return c.json({ error: "User not found" }, 404);

		// Calc Missions Progress
		const completedMissionsCount = await db
			.select({ count: count() })
			.from(missionNotification)
			.where(
				and(
					eq(missionNotification.userId, user.id),
					eq(missionNotification.isCompleted, true),
				),
			)
			.then((res) => res[0].count);

		const requiredForNextLevel = getRequiredMissions(userData.level);
		// Mock progress
		// TODO: Implement actual calculation based on previous levels
		const missionProgress = {
			current: completedMissionsCount % requiredForNextLevel, // Simple mock logic
			required: requiredForNextLevel,
			remaining:
				requiredForNextLevel - (completedMissionsCount % requiredForNextLevel),
		};
		const isLevelUpReady = missionProgress.remaining <= 0;

		// 2. Fetch Activity Logs for the Month
		const monthLogs = await db
			.select()
			.from(activityLog)
			.where(
				and(
					eq(activityLog.userId, user.id),
					sql`${activityLog.date} >= ${startDateStr}`,
					sql`${activityLog.date} <= ${endDateStr}`,
				),
			);

		// 3. Build Days Array
		const log = [];
		const daysInMonth = endDate.getDate();

		for (let d = 1; d <= daysInMonth; d++) {
			const dayStr = d.toString().padStart(2, "0");
			const monthStr = month.toString().padStart(2, "0");
			const dateStr = `${year}-${monthStr}-${dayStr}`;
			const checkDate = new Date(year, month - 1, d);
			const isFuture = checkDate > now;

			const dayLog = monthLogs.find((l) => l.date === dateStr);
			const hasActivity = !!dayLog;
			let stampData = null;

			if (hasActivity) {
				stampData = calculateStampFromLog(dayLog.durationMinutes);
			}

			log.push({
				date: dateStr,
				day: d,
				isFuture,
				hasActivity,
				stamp: stampData,
			});
		}

		return c.json({
			year,
			month,
			monthLabel: `${month}月`,
			currentStreak: userData.currentStreak,
			days: log,
			// Gamification Data
			level: userData.level,
			missionProgress: {
				current: missionProgress.current,
				required: missionProgress.required,
				remaining: missionProgress.remaining,
			},
			isLevelUpReady,
			stats: {
				maxStreak: userData.maxStreak,
				totalStamps: userData.userStamps.length,
				totalDuration: userData.totalDuration || 0, // from user table
			},
			gacha: {
				canDraw: isLevelUpReady,
			},
		});
	})
	.post("/gacha", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) return c.json({ error: "Unauthorized" }, 401);

		// Fetch currentUser to get level
		const currentUser = await db.query.user.findFirst({
			where: eq(userTable.id, user.id),
		});

		if (!currentUser) return c.json({ error: "User not found" }, 404);

		// Validate Logic: Check if user CAN level up.
		// For now, we trust the client or checking the same mock logic?
		// Ideally we check DB.
		// Let's assume for this "prototype" we allow it if we are testing,
		// but realistically we should check `missionNotification` count.

		// 1. Pick a random stamp the user DOESN'T have.
		const existingUserStamps = await db.query.userStamp.findMany({
			where: eq(userStamp.userId, user.id),
			columns: { stampId: true },
		});
		const existingIds = new Set(existingUserStamps.map((us) => us.stampId));

		const allStamps = await db.query.stamp.findMany();
		const availableStamps = allStamps.filter((s) => !existingIds.has(s.id));

		if (availableStamps.length === 0) {
			return c.json({
				error: "All stamps collected!",
				isComplete: true,
			});
		}

		const randomIndex = Math.floor(Math.random() * availableStamps.length);
		const newStamp = availableStamps[randomIndex];

		// 2. Add to User Collection
		await db.insert(userStamp).values({
			id: uuidv4(),
			userId: user.id,
			stampId: newStamp.id,
		});

		// 3. Level Up User
		await db
			.update(userTable)
			.set({
				level: currentUser.level + 1,
			})
			.where(eq(userTable.id, user.id));

		return c.json({
			success: true,
			stamp: newStamp,
			newLevel: currentUser.level + 1,
		});
	});

export default calendarRoute;
