export const calculateCurrentStreak = (dates: string[]): number => {
	if (dates.length === 0) return 0;

	// Sort dates descending (newest first) just in case
	const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

	const todayStr = new Date()
		.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
		.replaceAll("/", "-");

	// Helper to subtract days
	const getPreviousDateStr = (baseDateStr: string): string => {
		const date = new Date(baseDateStr);
		date.setDate(date.getDate() - 1);
		return date.toISOString().split("T")[0];
	};

	let streak = 0;
	let expectedDateStr = todayStr;

	// Check if the most recent date is today or yesterday
	// If the most recent log is NOT today, check if it's yesterday.
	// If it's older than yesterday, streak is broken -> 0 (or 1 if we just did today? logic depends on input)
	// Input `dates` comes from DB logs.
	// We assume `dates` INCLUDES today's log if it exists.

	// If the latest log is NOT today, we temporarily check yesterday.
	if (sortedDates[0] !== todayStr) {
		const yesterdayStr = getPreviousDateStr(todayStr);
		if (sortedDates[0] === yesterdayStr) {
			// Expected starts from yesterday
			expectedDateStr = yesterdayStr;
		} else {
			// Latest log is older than yesterday. Streak is 0.
			return 0;
		}
	}

	for (const dateStr of sortedDates) {
		if (dateStr === expectedDateStr) {
			streak++;
			expectedDateStr = getPreviousDateStr(expectedDateStr);
		} else {
			// Gap found
			break;
		}
	}

	return streak;
};
