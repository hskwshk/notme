"use server";

import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { db } from "@/lib/db";

export async function checkUserExists(username: string): Promise<boolean> {
	// Use binary comparison for case-sensitive check if the database collation is case-insensitive,
	// or standard equality if the database is set up standardly.
	// In Postgres, '=' is case sensitive by default for text.
	// However, to be absolutely sure we match the user's intent "Exact match condition",
	// we will rely on default Postgres behavior which is case sensitive.
	// e.g. 'User' != 'user'

	const foundUser = await db.query.user.findFirst({
		where: eq(user.username, username),
	});

	return !!foundUser;
}
