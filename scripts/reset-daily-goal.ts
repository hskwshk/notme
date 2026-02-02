import { eq } from "drizzle-orm";
import { userDailyGoal } from "../db/schema";
import { db } from "../lib/db";

async function resetDailyGoals() {
	console.log("Resetting daily goals...");

	const today = new Date()
		.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
		.replaceAll("/", "-");

	// Option 1: Delete today's goals to force re-creation
	// await db.delete(userDailyGoal).where(eq(userDailyGoal.date, today));

	// Option 2: Just set isViewed to false
	await db
		.update(userDailyGoal)
		.set({ isViewed: false })
		.where(eq(userDailyGoal.date, today));

	console.log("Reset complete for date:", today);
	process.exit(0);
}

resetDailyGoals();
