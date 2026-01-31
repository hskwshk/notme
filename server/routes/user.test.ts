import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { HonoEnv } from "@/server/types";
import { setup } from "@/tests/vitest.helper";
import userRoute from "./user";

type UserResponse = {
	users: {
		id: string;
		name: string;
		image: string | null;
		currentStreak: number;
	}[];
};

const { createUser, db } = await setup();

describe("/routes/user", () => {
	it("returns users matching the name query", async () => {
		const testUser = await createUser({
			name: "SearchTarget User",
			currentStreak: 10,
		});

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/search?q=SearchTarget");
		expect(res.status).toBe(200);

		const json = (await res.json()) as UserResponse;
		expect(json.users).toHaveLength(1);
		expect(json.users[0].id).toBe(testUser.id);
		expect(json.users[0].name).toBe("SearchTarget User");
	});

	it("returns users matching the id query", async () => {
		const testUser = await createUser();

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request(`/search?q=${testUser.id}`);
		expect(res.status).toBe(200);

		const json = (await res.json()) as UserResponse;
		expect(json.users).toHaveLength(1);
		expect(json.users[0].id).toBe(testUser.id);
	});

	it("returns empty array when no matches found", async () => {
		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/search?q=NonExistentUser12345");
		expect(res.status).toBe(200);

		const json = (await res.json()) as UserResponse;
		expect(json.users).toEqual([]);
	});

	it("returns empty array when query is empty", async () => {
		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				await next();
			})
			.route("/", userRoute);

		const res = await app.request("/search?q=");
		expect(res.status).toBe(200);

		const json = (await res.json()) as UserResponse;
		expect(json.users).toEqual([]);
	});
});
