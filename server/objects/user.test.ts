import { describe, expect, it } from "vitest";
import { usernameSchema } from "./user";

describe("usernameSchema", () => {
	it("validates valid usernames", () => {
		const validUsernames = [
			// User provided examples to ensure they pass
			"user.name",
			"a.b.c",
			"user_name",

			// Realistic examples with numbers
			"shoki.123",
			"john.doe_99",
			"user.name.01",
			"dev_02.test",
			"2024.new.user",

			// Existing basic cases
			"user1",
			"valid.name123",
			"single",
			"n",
		];

		for (const username of validUsernames) {
			const result = usernameSchema.safeParse(username);
			expect(result.success, `Expected '${username}' to be valid`).toBe(true);
		}
	});

	it("rejects invalid usernames", () => {
		const invalidUsernames = [
			".user", // Start dot
			"user.", // End dot
			"user..name", // Consecutive dots
			"..user",
			"user..",
			".", // Single dot
			"", // Empty
			"u/ser", // Invalid char
			"user name", // Space
			"user@name", // Symbol
		];

		for (const username of invalidUsernames) {
			const result = usernameSchema.safeParse(username);
			expect(result.success, `Expected '${username}' to be invalid`).toBe(
				false,
			);
		}
	});
});
