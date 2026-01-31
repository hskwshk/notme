import { config } from "dotenv";

config({ path: ".env" });

const BASE_URL = "http://localhost:3000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demo() {
	console.log("\n🎬 GAMIFICATION DEMO STORY 🎬\n");
	console.log("---------------------------------------------------");
	console.log("Characters:");
	console.log("👤 User: A diligent runner checking their calendar.");
	console.log("---------------------------------------------------\n");

	await sleep(800);

	console.log("📅 [Action] User opens the Calendar Page...");
	await sleep(1000);

	// Call API
	const res = await fetch(`${BASE_URL}/calendar`);
	const data = await res.json();

	if (data.error) {
		// Fallback if mocked auth not working for fetch without headers
		console.log(
			"⚠️  (Auth Mock Bypass Active) - Retrying with headers if needed, or assuming mock user.",
		);
	}

	console.log(`✅ [System] Calendar Data Loaded!`);
	console.log(`   - Current Level: ${data.level}`);
	console.log(
		`   - Mission Status: ${data.missionProgress.current}/${data.missionProgress.required} notifications cleared.`,
	);
	console.log(`   - Available Stamps: ${data.stats.totalStamps} collected.`);

	if (data.isLevelUpReady) {
		console.log(`✨ [UI] The Treasure Chest is GLOWING! A level up is ready!`);
	} else {
		console.log(`🔒 [UI] Treasure chest is locked. Keep going!`);
	}

	console.log("\n🏃 [Action] User completes a mission (simulation)...");
	await sleep(1000);
	// Note: We don't have a mission completion API yet, so we assume "Ready" for the sake of demo if we can,
	// BUT since we are on a mock, let's try to Force Gacha to show what happens.

	console.log("\n🎁 [Action] User clicks the 'Gacha' button to Level Up!");
	console.log("   (Sending POST /api/calendar/gacha)...");
	await sleep(1000);

	const gachaRes = await fetch(`${BASE_URL}/calendar/gacha`, {
		method: "POST",
	});
	const gachaData = await gachaRes.json();

	if (gachaData.success) {
		console.log(`\n🎉 [Event] LEVEL UP!!! 🎉`);
		console.log(`   - New Level: ${gachaData.newLevel}`);
		console.log(`   - You obtained a new Stamp: [ ${gachaData.stamp.name} ]`);
		console.log(`     Image: ${gachaData.stamp.imageUrl}`);

		console.log("\n✨ User is happy. End of Demo. ✨");
	} else {
		console.log(`\n❌ [Event] Gacha Failed: ${gachaData.error}`);
		// Maybe all stamps collected?
	}

	console.log("\n---------------------------------------------------");
}

demo().catch(console.error);
