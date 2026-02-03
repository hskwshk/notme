import { zValidator } from "@hono/zod-validator";
import { hashPassword } from "better-auth/crypto";
import { and, eq, gte, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "@/server/types";
import {
	account,
	activityLog,
	friendship,
	stamp,
	userStamp,
	user as userTable,
} from "../../db/schema";
import { createFileRepository } from "../infrastructure/repositories/file";
import { FileId } from "../objects/file";
import { passwordSchema, usernameSchema } from "../objects/user";

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
			const user = c.get("user");
			const { q } = c.req.valid("query");

			if (!user) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			if (!q) {
				return c.json({ users: [] });
			}

			// Search users (exclude self)
			const users = await db
				.select({
					id: userTable.id,
					name: userTable.name,
					image: userTable.image,
					currentStreak: userTable.currentStreak,
				})
				.from(userTable)
				.where(
					and(
						or(
							ilike(userTable.name, `%${q}%`),
							ilike(userTable.username, `%${q}%`),
							eq(userTable.id, q),
						),
					),
				)
				.limit(20);

			const filteredUsers = users.filter((u) => u.id !== user.id);

			if (filteredUsers.length === 0) {
				return c.json({ users: [] });
			}

			// Check friendship status
			// foundUserIds was unused, removed.

			const friendships = await db.query.friendship.findMany({
				where: or(
					and(eq(friendship.userId, user.id)),
					and(eq(friendship.friendId, user.id)),
				),
			});

			// Map status
			const usersWithStatus = filteredUsers.map((u) => {
				const rel = friendships.find(
					(f) =>
						(f.userId === user.id && f.friendId === u.id) ||
						(f.userId === u.id && f.friendId === user.id),
				);
				return {
					...u,
					friendshipStatus: rel ? rel.status : "none", // 'pending' or 'accepted' or 'none'
					isSender: rel ? rel.userId === user.id : false, // To distinguish if I sent the request
				};
			});

			return c.json({ users: usersWithStatus });
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
	})
	.delete("/:id/friend-request", async (c) => {
		const db = c.get("db");
		const user = c.get("user");
		const friendId = c.req.param("id");

		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Delete pending request where user is sender and friendId is recipient
		await db
			.delete(friendship)
			.where(
				and(
					eq(friendship.userId, user.id),
					eq(friendship.friendId, friendId),
					eq(friendship.status, "pending"),
				),
			);

		return c.json({ success: true });
	})
	.get("/me/friend-requests", async (c) => {
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
	})
	.post("/friend-request/:requestId/accept", async (c) => {
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
	})
	.delete("/friend-request/:requestId", async (c) => {
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
	})
	.delete("/:id/friend", async (c) => {
		const db = c.get("db");
		const user = c.get("user");
		const friendId = c.req.param("id");

		if (!user) return c.json({ error: "Unauthorized" }, 401);

		// Find and delete accepted friendship
		const existingFriendship = await db.query.friendship.findFirst({
			where: and(
				or(
					and(
						eq(friendship.userId, user.id),
						eq(friendship.friendId, friendId),
					),
					and(
						eq(friendship.userId, friendId),
						eq(friendship.friendId, user.id),
					),
				),
				eq(friendship.status, "accepted"),
			),
		});

		if (!existingFriendship) {
			return c.json({ error: "Friendship not found" }, 404);
		}

		await db.delete(friendship).where(eq(friendship.id, existingFriendship.id));

		return c.json({ success: true });
	})
	.get("/me/friends", async (c) => {
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
	})
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

		// 3. Graph Data (Last 7 days) & Month Max (Last 30 days for scaling)
		const today = new Date();
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(today.getDate() - 30);
		const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(today.getDate() - 6);

		// Fetch logs for last 30 days to get max
		const logs = await db
			.select()
			.from(activityLog)
			.where(
				and(
					eq(activityLog.userId, user.id),
					gte(activityLog.date, thirtyDaysAgoStr),
				),
			);

		// Calculate max minutes in last 30 days
		const monthMaxMinutes = logs.reduce(
			(max, log) => (log.durationMinutes > max ? log.durationMinutes : max),
			0,
		);

		// Initialize 7 days array
		const graph = [];
		// Max within the 7 days (to highlight the bar)
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

				username: user.username,
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
				monthMaxMinutes: monthMaxMinutes,
			},
			graph: graphWithMax,
			favoriteStamps: favoriteStamps,
		});
	})
	.get("/me/stamps", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		if (!user) return c.json({ error: "Unauthorized" }, 401);

		const userStamps = await db
			.select({
				id: stamp.id,
				name: stamp.name,
				imageUrl: stamp.imageUrl,
				isFavorite: userStamp.isFavorite,
				favoriteOrder: userStamp.favoriteOrder,
			})
			.from(userStamp)
			.innerJoin(stamp, eq(userStamp.stampId, stamp.id))
			.where(eq(userStamp.userId, user.id));

		return c.json({ stamps: userStamps });
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
		const file = body.file;

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

		try {
			const uploaded = await fileRepository.saveBlobFile(blobFile);
			const imageUrl =
				!baseUrl || baseUrl.includes("barbar.foo")
					? `/${uploaded.bucket}/${uploaded.key}`
					: `${baseUrl}/${uploaded.bucket}/${uploaded.key}`;

			await db
				.update(userTable)
				.set({ image: imageUrl })
				.where(eq(userTable.id, sessionUser.id));

			return c.json({ url: imageUrl });
		} catch (error) {
			console.error("Backend Upload Error:", error);
			return c.json(
				{
					error: "Internal Server Error during file upload",
					details: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	})
	.put(
		"/me/profile",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).optional(),
				username: usernameSchema.optional(),
				password: passwordSchema.optional(),
				characterName: z.string().optional(),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const sessionUser = c.get("user");
			const { name, username, characterName, password } = c.req.valid("json");

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

			// Update Password if provided
			if (password) {
				const hashedPassword = await hashPassword(password);
				await db
					.update(account)
					.set({ password: hashedPassword })
					.where(eq(account.userId, user.id));
			}

			return c.json({ success: true });
		},
	);

export default app;
