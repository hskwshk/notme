import { and, eq, gte, or } from "drizzle-orm";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import {
	activityLog,
	appNotification,
	friendship,
	user as userTable,
} from "@/db/schema";
import { calculateStampFromLog } from "@/server/objects/stamp";
import { calculateCurrentStreak } from "@/server/services/streak";
import type { HonoEnv } from "@/server/types";

const homeRoute = new Hono<HonoEnv>()
	.get("/", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// 1. Fetch User Extended Details
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
			and(
				eq(appNotification.userId, user.id),
				eq(appNotification.isRead, false),
			),
		);

		// 3. Activity Stats (Today) & Stamp Logic
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
				isStampViewed: false,
			});
			// Fetch again to be sure or construct object
			currentLog = {
				id: newLogId,
				userId: user.id,
				date: today,
				durationMinutes: 0,
				isStampViewed: false,
				createdAt: new Date(),
			};
		}

		// 4. Streak Calculation
		// Recalculate based on history
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
		if (
			newStreak !== userData.currentStreak ||
			newStreak > userData.maxStreak
		) {
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

		// Stamp Modal Logic
		const shouldShowStampModal = !currentLog.isStampViewed;
		const stampData = calculateStampFromLog(currentLog.durationMinutes);

		// 5. Graph Data
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
			let label = "";
			if (i === 0) label = "今日";
			else if (i === 1) label = "昨日";
			else label = `${i}日前`;

			const log = recentLogs.find((l) => l.date === dateStr);
			graphDataRaw.push({
				date: dateStr,
				label,
				minutes: log?.durationMinutes || 0,
			});
		}

		// Find the max minutes within these 5 days to highlight
		const maxIn5Days = Math.max(...graphDataRaw.map((g) => g.minutes));

		const graphData = graphDataRaw.map((g) => ({
			label: g.label,
			minutes: g.minutes,
			type: "daily",
			isMostEffort: maxIn5Days > 0 && g.minutes === maxIn5Days,
		}));

		// 6. Daily Quote
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
				todayExerciseMinutes: currentLog.durationMinutes,
				maxExerciseMinutes: userData.maxMinutes,
				monthMaxMinutes: monthMaxMinutes,
				graphData,
			},
			dailyQuote: quote ? { text: quote.content } : null,
			stampModal: {
				shouldShow: shouldShowStampModal,
				stamp: stampData,
			},
			friends: await Promise.all(
				(
					await db
						.select()
						.from(friendship)
						.where(
							and(
								or(
									eq(friendship.userId, user.id),
									eq(friendship.friendId, user.id),
								),
								eq(friendship.status, "accepted"),
							),
						)
				).map(async (f) => {
					// Determines the OTHER user's ID
					const friendUserId = f.userId === user.id ? f.friendId : f.userId;

					// Fetch Friend Profile
					const friendProfile = await db.query.user.findFirst({
						where: eq(userTable.id, friendUserId),
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

					if (!friendProfile) return null;

					// Fetch Friend's Today Log
					const friendTodayLog = await db.query.activityLog.findFirst({
						where: and(
							eq(activityLog.userId, friendUserId),
							eq(activityLog.date, today),
						),
					});

					// Fetch Friend's Recent Logs (for graph)
					// Reusing logic: last 5 days
					const friendRecentLogs = await db
						.select()
						.from(activityLog)
						.where(
							and(
								eq(activityLog.userId, friendUserId),
								gte(activityLog.date, thirtyDaysAgoStr), // fetching enough for graph
							),
						);

					const friendGraphData = [];
					// Max for graph scaling (optional, UI might use fixed or relative)
					// Just returning the data points
					for (let i = 4; i >= 0; i--) {
						const d = new Date();
						d.setDate(d.getDate() - i);
						const dateStr = d.toISOString().split("T")[0];
						let label = "";
						if (i === 0) label = "今日";
						else if (i === 1) label = "昨日";
						else label = `${i}日前`;

						const log = friendRecentLogs.find((l) => l.date === dateStr);
						friendGraphData.push({
							label,
							minutes: log?.durationMinutes || 0,
							type: "daily",
							isMostEffort: false,
						});
					}

					return {
						user: {
							name: friendProfile.name,
							image: friendProfile.image,
							characterName: friendProfile.characterName,
							level: friendProfile.level,
						},
						stats: {
							currentStreak: friendProfile.currentStreak,
							maxStreak: friendProfile.maxStreak,
							todayExerciseMinutes: friendTodayLog?.durationMinutes || 0,
							maxExerciseMinutes: friendProfile.maxMinutes,
							graphData: friendGraphData,
						},
						quote: quote ? { text: quote.content } : null, // Reusing system quote
					};
				}),
			).then((list) => list.filter((f) => f !== null)),
		});
	})
	.post("/stamp-seen", async (c) => {
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

		await db
			.update(activityLog)
			.set({ isStampViewed: true })
			.where(and(eq(activityLog.userId, user.id), eq(activityLog.date, today)));

		return c.json({ success: true });
	});

export default homeRoute;
