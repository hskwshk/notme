import { and, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { activityLog, appNotification, user as userTable } from "@/db/schema";
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

	const todayLog = await db.query.activityLog.findFirst({
		where: and(eq(activityLog.userId, user.id), eq(activityLog.date, today)),
	});

	// 4. Graph Data
	// - "Max/Month": The single highest duration in the last 30 days (for Y-axis scaling)
	// - Last 5 days daily data (for the graph itself)

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

	// Find max in month for Y-axis scaling
	const monthMaxMinutes = recentLogs.reduce(
		(max, log) => (log.durationMinutes > max ? log.durationMinutes : max),
		0,
	);

	// Generate last 5 days data
	const graphDataRaw = [];
	for (let i = 4; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().split("T")[0];
		// If i == 0 it's today, i == 1 it's yesterday, etc.
		// Label logic can be simple (or based on design requirements).
		// For now let's use "Today" for 0, "Yesterday" for 1, and formatted date or simple "N日前" for others.
		// Current requirement didn't specify exact labels for 2-4 days ago, so let's stick to simple relative or date.
		// Actually the previous code used "3日前", "昨日", "今日". Let's use "N日前" for > 1.
		let label = "";
		if (i === 0) label = "今日";
		else if (i === 1) label = "昨日";
		else label = `${i}日前`;

		const log = recentLogs.find((l) => l.date === dateStr);
		graphDataRaw.push({
			date: dateStr,
			label,
			minutes: log?.durationMinutes || 0,
			// type: "daily" // We can remove 'type' if it's all daily now, or keep it.
		});
	}

	// Find the max minutes within these 5 days to highlight
	// If all are 0, maybe no highlight? or just highlight one? Let's highlight the first max found.
	const maxIn5Days = Math.max(...graphDataRaw.map((g) => g.minutes));

	const graphData = graphDataRaw.map((g) => ({
		label: g.label,
		minutes: g.minutes,
		type: "daily",
		isMostEffort: maxIn5Days > 0 && g.minutes === maxIn5Days,
	}));

	// 5. Daily Quote
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
			todayExerciseMinutes: todayLog?.durationMinutes || 0,
			maxExerciseMinutes: userData.maxMinutes, // Keeping this as user lifetime max? Or replace?
			// User asked for "Vertical axis max is max in past month".
			// So let's provide monthMaxMinutes.
			monthMaxMinutes: monthMaxMinutes,
			graphData,
		},
		dailyQuote: quote ? { text: quote.content } : null,
	});
});

export default homeRoute;
