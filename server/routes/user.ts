import { zValidator } from "@hono/zod-validator";
import { eq, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "@/server/types";
import { user } from "../../db/schema";

const app = new Hono<HonoEnv>().get(
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
				id: user.id,
				name: user.name,
				image: user.image,
				currentStreak: user.currentStreak,
			})
			.from(user)
			.where(or(like(user.name, `%${q}%`), eq(user.id, q)))
			.limit(20);

		return c.json({ users });
	},
);

export default app;
