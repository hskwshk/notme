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

describe("POST /:id/friend-request", () => {
	it("successfully sends friend request", async () => {
		const userA = await createUser({ id: "user_a" });
		const userB = await createUser({ id: "user_b" });

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userA as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		const res = await app.request(`/${userB.id}/friend-request`, {
			method: "POST",
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ success: true, status: "pending" });
	});

	it("fails when sending request to self", async () => {
		const userA = await createUser({ id: "user_a_self" });

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userA as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		const res = await app.request(`/${userA.id}/friend-request`, {
			method: "POST",
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as { error: string };
		expect(json.error).toBe("Cannot send friend request to yourself");
	});

	it("fails when friendship already exists", async () => {
		const userA = await createUser({ id: "user_a_dup" });
		const userB = await createUser({ id: "user_b_dup" });

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userA as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		// First Request
		await app.request(`/${userB.id}/friend-request`, { method: "POST" });

		// Duplicate Request
		const res = await app.request(`/${userB.id}/friend-request`, {
			method: "POST",
		});

		expect(res.status).toBe(400);
		const json = (await res.json()) as { error: string };
		expect(json.error).toBe("Friendship already exists or pending");
	});
});

describe("Friend Request Management", () => {
	it("lists pending friend requests", async () => {
		const userMe = await createUser({ id: "me_pending" });
		const userSender = await createUser({ id: "sender" });

		const app = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userMe as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		// Seed a request using the API (pretending to be sender)
		const appSender = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userSender as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		await appSender.request(`/${userMe.id}/friend-request`, { method: "POST" });

		// Now check my requests
		const res = await app.request("/me/friend-requests");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.requests).toHaveLength(1);
		expect(json.requests[0].user.id).toBe(userSender.id);
		// Validate requestId is present
		expect(json.requests[0].id).toBeDefined();
	});

	it("accepts a friend request", async () => {
		const userMe = await createUser({ id: "me_accept" });
		const userSender = await createUser({ id: "sender_accept" });

		// Create Request directly or via API
		const appSender = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userSender as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);
		await appSender.request(`/${userMe.id}/friend-request`, { method: "POST" });

		// Fetch request ID
		const appMe = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userMe as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		const listRes = await appMe.request("/me/friend-requests");
		const listJson = await listRes.json();
		const requestId = listJson.requests[0].id;

		// Accept it
		const acceptRes = await appMe.request(
			`/friend-request/${requestId}/accept`,
			{ method: "POST" },
		);
		expect(acceptRes.status).toBe(200);

		// Verify it's gone from pending
		const listRes2 = await appMe.request("/me/friend-requests");
		const listJson2 = await listRes2.json();
		expect(listJson2.requests).toHaveLength(0);

		// Verify in friends list
		const friendsRes = await appMe.request("/me/friends");
		const friendsJson = await friendsRes.json();
		expect(friendsJson.friends).toHaveLength(1);
		expect(friendsJson.friends[0].id).toBe(userSender.id);
	});

	it("rejects/cancels a friend request", async () => {
		const userMe = await createUser({ id: "me_reject" });
		const userSender = await createUser({ id: "sender_reject" });

		// Sender sends
		const appSender = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userSender as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);
		await appSender.request(`/${userMe.id}/friend-request`, { method: "POST" });

		// Me fetches ID
		const appMe = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userMe as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);
		const listRes = await appMe.request("/me/friend-requests");
		const requestId = (await listRes.json()).requests[0].id;

		// Reject
		const delRes = await appMe.request(`/friend-request/${requestId}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);

		// Verify gone
		const listRes2 = await appMe.request("/me/friend-requests");
		expect((await listRes2.json()).requests).toHaveLength(0);
	});

	it("shows friends list correctly (bidirectional)", async () => {
		const userA = await createUser({ id: "friend_a" });
		const userB = await createUser({ id: "friend_b" });

		// A sends to B
		const appA = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userA as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);
		await appA.request(`/${userB.id}/friend-request`, { method: "POST" });

		// B accepts
		const appB = new Hono<HonoEnv>()
			.use(async (c, next) => {
				c.set("db", db);
				// biome-ignore lint/suspicious/noExplicitAny: mocked user for test
				c.set("user", userB as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				await next();
			})
			.route("/", userRoute);

		const listRes = await appB.request("/me/friend-requests");
		const requestId = (await listRes.json()).requests[0].id;
		await appB.request(`/friend-request/${requestId}/accept`, {
			method: "POST",
		});

		// Check A's friends list
		const friResA = await appA.request("/me/friends");
		const friJsonA = await friResA.json();
		expect(friJsonA.friends).toHaveLength(1);
		expect(friJsonA.friends[0].id).toBe(userB.id);

		// Check B's friends list
		const friResB = await appB.request("/me/friends");
		const friJsonB = await friResB.json();
		expect(friJsonB.friends).toHaveLength(1);
		expect(friJsonB.friends[0].id).toBe(userA.id);
	});
});
