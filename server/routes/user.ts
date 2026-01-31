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

export default app;
