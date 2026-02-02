import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "@/server/types";
import {
	activityLog,
	friendship,
	stamp,
	userStamp,
	user as userTable,
} from "../../db/schema";
import { createFileRepository } from "../infrastructure/repositories/file";
import { FileId } from "../objects/file";

const app = new Hono<HonoEnv>()
	.get(
		"/search",
		zValidator(
			"query",
			z.object({
				q: z.string().optional(),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const { q } = c.req.valid("query");

			if (!q) {
				return c.json({ users: [] });
			}

			const users = await db
				.select({
					id: userTable.id,
					name: userTable.name,
					image: userTable.image,
					currentStreak: userTable.currentStreak,
				})
				.from(userTable)
				.where(or(like(userTable.name, `%${q}%`), eq(userTable.id, q)))
				.limit(20);

			return c.json({ users });
		},
	)
	.post("/:id/friend-request", async (c) => {
		const db = c.get("db");
		const user = c.get("user");
		const friendId = c.req.param("id");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		if (user.id === friendId) {
			return c.json({ error: "Cannot send friend request to yourself" }, 400);
		}

		// Check if friend exists
		const friendExists = await db.query.user.findFirst({
			where: eq(userTable.id, friendId),
		});

		if (!friendExists) {
			return c.json({ error: "User not found" }, 404);
		}

		// Check existing friendship
		const existingFriendship = await db.query.friendship.findFirst({
			where: or(
				and(eq(friendship.userId, user.id), eq(friendship.friendId, friendId)),
				and(eq(friendship.userId, friendId), eq(friendship.friendId, user.id)),
			),
		});

		if (existingFriendship) {
			return c.json(
				{
					error: "Friendship already exists or pending",
					status: existingFriendship.status,
				},
				400,
			);
		}

		// Create Friend Request
		await db.insert(friendship).values({
			id: crypto.randomUUID(),
			userId: user.id,
			friendId: friendId,
			status: "pending",
		});

		return c.json({ success: true, status: "pending" });
	});

app.get("/me/friend-requests", async (c) => {
	const db = c.get("db");
	const user = c.get("user");

	if (!user) return c.json({ error: "Unauthorized" }, 401);

	const requests = await db.query.friendship.findMany({
		where: and(
			eq(friendship.friendId, user.id),
			eq(friendship.status, "pending"),
		),
		with: {
			user: true, // The sender
		},
	});

	return c.json({ requests });
});

app.post("/friend-request/:requestId/accept", async (c) => {
	const db = c.get("db");
	const user = c.get("user");
	const requestId = c.req.param("requestId");

	if (!user) return c.json({ error: "Unauthorized" }, 401);

	// Verify request exists and is for me
	const request = await db.query.friendship.findFirst({
		where: and(
			eq(friendship.id, requestId),
			eq(friendship.friendId, user.id),
			eq(friendship.status, "pending"),
		),
	});

	if (!request) {
		return c.json({ error: "Friend request not found" }, 404);
	}

	// Accept
	await db
		.update(friendship)
		.set({ status: "accepted" })
		.where(eq(friendship.id, requestId));

	return c.json({ success: true });
});

app.delete("/friend-request/:requestId", async (c) => {
	const db = c.get("db");
	const user = c.get("user");
	const requestId = c.req.param("requestId");

	if (!user) return c.json({ error: "Unauthorized" }, 401);

	// Verify request exists and involves me
	const request = await db.query.friendship.findFirst({
		where: eq(friendship.id, requestId),
	});

	if (!request) {
		return c.json({ error: "Friend request not found" }, 404);
	}

	if (request.userId !== user.id && request.friendId !== user.id) {
		return c.json({ error: "Unauthorized" }, 403);
	}

	// Delete
	await db.delete(friendship).where(eq(friendship.id, requestId));

	return c.json({ success: true });
});

app.get("/me/friends", async (c) => {
	const db = c.get("db");
	const user = c.get("user");

	if (!user) return c.json({ error: "Unauthorized" }, 401);

	const friendsRecords = await db.query.friendship.findMany({
		where: and(
			or(eq(friendship.userId, user.id), eq(friendship.friendId, user.id)),
			eq(friendship.status, "accepted"),
		),
		with: {
			user: true, // sender
			friend: true, // recipient
		},
	});

	const friends = friendsRecords.map((f) => {
		if (f.userId === user.id) {
			return f.friend;
		}
		return f.user;
	});

	return c.json({ friends });
});

app
	.get("/me/profile", async (c) => {
		const db = c.get("db");
		const sessionUser = c.get("user");

		if (!sessionUser) return c.json({ error: "Unauthorized" }, 401);

		// Fetch full user data
		const user = await db.query.user.findFirst({
			where: eq(userTable.id, sessionUser.id),
		});

		if (!user) return c.json({ error: "User not found" }, 404);

		// 1. Social Counts
		const [followingCount] = await db
			.select({ count: sql<number>`count(*)` })
			.from(friendship)
			.where(
				and(eq(friendship.userId, user.id), eq(friendship.status, "accepted")),
			);

		const [followerCount] = await db
			.select({ count: sql<number>`count(*)` })
			.from(friendship)
			.where(
				and(
					eq(friendship.friendId, user.id),
					eq(friendship.status, "accepted"),
				),
			);

		const [requestCount] = await db
			.select({ count: sql<number>`count(*)` })
			.from(friendship)
			.where(
				and(eq(friendship.friendId, user.id), eq(friendship.status, "pending")),
			);

		// 2. Stamps (Total & Top 3 Favorites)
		const [totalStamps] = await db
			.select({ count: sql<number>`count(*)` })
			.from(userStamp)
			.where(eq(userStamp.userId, user.id));

		const favoriteStamps = await db
			.select({
				id: stamp.id,
				name: stamp.name,
				imageUrl: stamp.imageUrl,
				favoriteOrder: userStamp.favoriteOrder,
			})
			.from(userStamp)
			.innerJoin(stamp, eq(userStamp.stampId, stamp.id))
			.where(and(eq(userStamp.userId, user.id), eq(userStamp.isFavorite, true)))
			.orderBy(userStamp.favoriteOrder);

		// 3. Graph Data (Last 7 days)
		const today = new Date();
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(today.getDate() - 6);
		const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

		const logs = await db
			.select()
			.from(activityLog)
			.where(
				and(
					eq(activityLog.userId, user.id),
					gte(activityLog.date, sevenDaysAgoStr),
				),
			);

		// Initialize 7 days array
		const graph = [];
		let maxInWeek = 0;

		for (let i = 0; i < 7; i++) {
			const d = new Date(sevenDaysAgo);
			d.setDate(d.getDate() + i);
			// Format as YYYY-MM-DD to match DB
			const dateStr = d.toISOString().split("T")[0];

			const log = logs.find((l) => l.date === dateStr);
			const minutes = log ? log.durationMinutes : 0;

			if (minutes > maxInWeek) maxInWeek = minutes;

			graph.push({
				date: dateStr,
				minutes,
			});
		}

		// Add isMax flag (if 0, no max)
		const graphWithMax = graph.map((g) => ({
			...g,
			isMax: maxInWeek > 0 && g.minutes === maxInWeek,
		}));

		return c.json({
			user: {
				id: user.id,
				name: user.name,
				image: user.image,
				characterName: user.characterName,
				level: user.level,
				currentStreak: user.currentStreak,
				maxStreak: user.maxStreak,
				totalDuration: user.totalDuration,
				maxMinutes: user.maxMinutes,
			},
			stats: {
				followingCount: Number(followingCount?.count || 0),
				followerCount: Number(followerCount?.count || 0),
				requestCount: Number(requestCount?.count || 0),
				totalStampCount: Number(totalStamps?.count || 0),
			},
			graph: graphWithMax,
			favoriteStamps: favoriteStamps,
		});
	})
	.put(
		"/me/profile/favorite-stamps",
		zValidator(
			"json",
			z.object({
				stampIds: z.array(z.string()).max(3),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const user = c.get("user");
			const { stampIds } = c.req.valid("json");

			if (!user) return c.json({ error: "Unauthorized" }, 401);

			// 1. Validate Ownership: Ensure user owns all these stamps
			if (stampIds.length > 0) {
				const ownedStamps = await db
					.select({ id: userStamp.stampId })
					.from(userStamp)
					.where(and(eq(userStamp.userId, user.id)));

				const ownedIds = new Set(ownedStamps.map((s) => s.id));
				const allOwned = stampIds.every((id) => ownedIds.has(id));

				if (!allOwned) {
					return c.json(
						{ error: "You do not own one or more of these stamps" },
						400,
					);
				}
			}

			// 2. Transaction: Reset all, then set new favorites
			await db.transaction(async (tx) => {
				// Reset all favorites for this user
				await tx
					.update(userStamp)
					.set({ isFavorite: false, favoriteOrder: null })
					.where(eq(userStamp.userId, user.id));

				// Set new favorites with order
				for (let i = 0; i < stampIds.length; i++) {
					await tx
						.update(userStamp)
						.set({ isFavorite: true, favoriteOrder: i + 1 })
						.where(
							and(
								eq(userStamp.userId, user.id),
								eq(userStamp.stampId, stampIds[i]),
							),
						);
				}
			});
			return c.json({ success: true });
		},
	)
	.post("/me/profile/image", async (c) => {
		const db = c.get("db");
		const sessionUser = c.get("user");

		if (!sessionUser) return c.json({ error: "Unauthorized" }, 401);

		const body = await c.req.parseBody();
		const file = body["file"];

		if (!file || !(file instanceof File)) {
			return c.json({ error: "No file uploaded" }, 400);
		}

		const { client, baseUrl } = c.get("r2");
		const fileRepository = createFileRepository(client, db, baseUrl);

		const blobFile = {
			kind: "BlobFile" as const,
			id: FileId(crypto.randomUUID()),
			bucket: "uploads",
			key: `users/${sessionUser.id}/${Date.now()}-${file.name}`,
			blob: file,
			contentType: file.type,
			expiresAt: null,
		};

		const uploaded = await fileRepository.saveBlobFile(blobFile);
		const imageUrl = `${baseUrl}/${uploaded.bucket}/${uploaded.key}`;

		await db
			.update(userTable)
			.set({ image: imageUrl })
			.where(eq(userTable.id, sessionUser.id));

		return c.json({ url: imageUrl });
	})
	.put(
		"/me/profile",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).optional(),
				username: z
					.string()
					.min(1)
					.regex(
						/^[a-zA-Z0-9_]+$/,
						"Only letters, numbers and underscores allowed",
					)
					.optional(),
				password: z
					.string()
					.min(8)
					.regex(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric")
					.optional(),
				characterName: z.string().optional(),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const sessionUser = c.get("user");
			const { name, username, characterName } = c.req.valid("json");

			if (!sessionUser) return c.json({ error: "Unauthorized" }, 401);

			// Fetch full user to get current username
			const user = await db.query.user.findFirst({
				where: eq(userTable.id, sessionUser.id),
			});

			if (!user) return c.json({ error: "User not found" }, 404);

			// Check username uniqueness if changing
			if (username && username !== user.username) {
				const existing = await db.query.user.findFirst({
					where: eq(userTable.username, username),
				});
				if (existing) {
					return c.json({ error: "Username already taken" }, 400);
				}
			}

			// Update User
			await db
				.update(userTable)
				.set({
					name: name ?? undefined,
					username: username ?? undefined,
					characterName: characterName ?? undefined,
				})
				.where(eq(userTable.id, user.id));

			// Password update skipped (see previous notes)

			return c.json({ success: true });
		},
	);

export default app;
