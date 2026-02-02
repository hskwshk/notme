import { zValidator } from "@hono/zod-validator";
import { and, eq, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "@/server/types";
import { friendship, user as userTable } from "../../db/schema";

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
						or(like(userTable.name, `%${q}%`), eq(userTable.id, q)),
						// Exclude self handled by filter next, but optimization:
						// ne(userTable.id, user.id) // if imported 'ne'
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

export default app;
