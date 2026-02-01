import { and, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { activityLog, appNotification, user as userTable } from "@/db/schema";
import { calculateCurrentStreak } from "@/server/services/streak";
import type { HonoEnv } from "@/server/types";

const homeRoute = new Hono<HonoEnv>().get("/", async (c) => {
	const db = c.get("db");
	const user = c.get("user");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// 1. Fetch User Extended Details
	// We need to fetch fresh user data as session might be stale for new fields
	const userData = await db.query.user.findFirst({
		where: eq(userTable.id, user.id),
		columns: {
			name: true,
			image: true,
			characterName: true,
			level: true,
			currentStreak: true,
			maxStreak: true,
			maxMinutes: true,
		},
	});

	if (!userData) return c.json({ error: "User not found" }, 404);

	// 2. Check Notifications
	const unreadCount = await db.$count(
		appNotification,
		and(eq(appNotification.userId, user.id), eq(appNotification.isRead, false)),
	);

	// 3. Activity Stats (Today)
	const today = new Date()
		.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
		.replaceAll("/", "-");

	let currentLog = await db.query.activityLog.findFirst({
		where: and(eq(activityLog.userId, user.id), eq(activityLog.date, today)),
	});

	if (!currentLog) {
		// Auto-create log for stamp if not exists (login bonus)
		const newLogId = uuidv4();
		await db.insert(activityLog).values({
			id: newLogId,
			userId: user.id,
			date: today,
			durationMinutes: 0,
		});
		// Fetch again to be sure or construct object
		currentLog = {
			id: newLogId,
			userId: user.id,
			date: today,
			durationMinutes: 0,
			createdAt: new Date(),
		};
	}
	// 4. Streak Calculation
	// Even if we just created a log, let's recalculate based on history to be safe and robust.
	// We fetch ALL dates logic or just recent? simple streak won't exceed years usually, but fetching all date strings is cheap enough for MVP.
	// Optimally: Fetch last 365 days of dates only.
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
	const oneYearAgoStr = oneYearAgo.toISOString().split("T")[0];

	const logsForStreak = await db
		.select({ date: activityLog.date })
		.from(activityLog)
		.where(
			and(
				eq(activityLog.userId, user.id),
				gte(activityLog.date, oneYearAgoStr),
			),
		);

	const distinctDates = Array.from(new Set(logsForStreak.map((l) => l.date)));
	const newStreak = calculateCurrentStreak(distinctDates);

	// Update User if streak changed or max streak improved
	if (newStreak !== userData.currentStreak || newStreak > userData.maxStreak) {
		await db
			.update(userTable)
			.set({
				currentStreak: newStreak,
				maxStreak: Math.max(newStreak, userData.maxStreak),
			})
			.where(eq(userTable.id, user.id));

		// Update local userData for response
		userData.currentStreak = newStreak;
		userData.maxStreak = Math.max(newStreak, userData.maxStreak);
	}

	// 5. Graph Data
	// 5. Graph Data
	// - "Max/Month": Simplified to just picking the highest duration in last 30 days
	// - "3 days ago", "Yesterday", "Today"

	// Fetch last 30 days logs
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

	const recentLogs = await db
		.select()
		.from(activityLog)
		.where(
			and(
				eq(activityLog.userId, user.id),
				gte(activityLog.date, thirtyDaysAgoStr),
			),
		);

	// Find max in month
	const maxInMonth = recentLogs.reduce(
		(max, log) => (log.durationMinutes > max ? log.durationMinutes : max),
		0,
	);

	// Map specific days for graph
	const getMinutesForDate = (targetDateStr: string) =>
		recentLogs.find((l) => l.date === targetDateStr)?.durationMinutes || 0;

	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const threeDaysAgo = new Date();
	threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Based on "3 days ago" label, implies today-3? Or just a random past point?
	// The image says "Left to right: Max/Month, ..., Today".
	// Let's stick to the plan: Max/Month, 3 days ago, Yesterday, Today.

	const graphData = [
		{ label: "最大/月", minutes: maxInMonth, type: "max" },
		{
			label: "3日前",
			minutes: getMinutesForDate(threeDaysAgo.toISOString().split("T")[0]),
			type: "daily",
		},
		{
			label: "昨日",
			minutes: getMinutesForDate(yesterday.toISOString().split("T")[0]),
			type: "daily",
		},
		{ label: "今日", minutes: getMinutesForDate(today), type: "daily" },
	];

	// 6. Daily Quote
	// Just pick one randomly or the latest
	const quote = await db.query.dailyQuote.findFirst();

	return c.json({
		user: {
			name: userData.name,
			image: userData.image,
			characterName: userData.characterName,
			level: userData.level,
			hasUnreadNotifications: unreadCount > 0,
		},
		stats: {
			currentStreak: userData.currentStreak,
			maxStreak: userData.maxStreak,
			todayExerciseMinutes: currentLog?.durationMinutes || 0,
			maxExerciseMinutes: userData.maxMinutes,
			graphData,
		},
		dailyQuote: quote ? { text: quote.content } : null,
	});
});

export default homeRoute;
