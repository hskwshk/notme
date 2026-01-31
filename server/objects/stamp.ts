export type StampType = "default" | "light" | "medium" | "hard";

export interface StampData {
	type: StampType;
	label: string;
}

export const calculateStampFromLog = (durationMinutes: number): StampData => {
	// Logic extracted from calendar.ts
	// If duration is 0, we can decide if it counts as "light" or something else.
	// Based on request "login gets a stamp", if duration is 0 (auto-created),
	// we should probably give a basic stamp or "completed".
	// Let's assume 0 minutes (just login) => "light" (運動した) for now,
	// or maybe a specific "login" stamp?
	// The implementation plan said: "運動した (Light)" equivalent.

	let stampData: StampData = {
		type: "default",
		label: "記録あり",
	};

	if (durationMinutes > 60) {
		stampData = { type: "hard", label: "めちゃ走った" };
	} else if (durationMinutes > 30) {
		stampData = { type: "medium", label: "走った" };
	} else {
		// Covers 0 to 30 minutes
		stampData = { type: "light", label: "運動した" };
	}

	return stampData;
};
