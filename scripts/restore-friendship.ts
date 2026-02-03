import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { friendship } from "../db/schema";
import { db } from "../lib/db";

async function main() {
	const userId = "UPsacHM5DRgnvyNQnMMd35vSFUApwQ49"; // Shoki
	const friendId = "019c102d-068a-7d12-aad4-db10304c46fb"; // Test User

	const existing = await db.query.friendship.findFirst({
		where: and(
			eq(friendship.userId, userId),
			eq(friendship.friendId, friendId),
		),
	});

	console.log("Existing friendship:", existing);

	if (existing) {
		if (existing.status !== "accepted") {
			console.log("Updating to accepted...");
			await db
				.update(friendship)
				.set({ status: "accepted" })
				.where(eq(friendship.id, existing.id));
			console.log("Updated!");
		} else {
			console.log("Already accepted.");
		}
	} else {
		console.log("Inserting new friendship...");
		await db.insert(friendship).values({
			id: uuidv4(),
			userId: userId,
			friendId: friendId,
			status: "accepted",
		});
		console.log("Inserted!");
	}
	process.exit(0);
}

main();
