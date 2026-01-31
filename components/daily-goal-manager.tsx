"use client";

import { useEffect, useState } from "react";
import { DailyGoalModal } from "@/components/daily-goal-modal";
import { apiClient } from "@/lib/api-client";

interface DailyGoal {
	id: string;
	title: string;
	imageUrl: string | null;
	description: string | null;
	footer: string | null;
	isViewed: boolean;
}

export function DailyGoalManager() {
	const [goal, setGoal] = useState<DailyGoal | null>(null);

	useEffect(() => {
		const checkAndFetchGoal = async () => {
			console.log("DailyGoalManager: checkAndFetchGoal started");
			// TEST: Reset viewed status for testing
			localStorage.removeItem("lastViewedGoalDate");

			const today = new Date()
				.toLocaleDateString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				})
				.replaceAll("/", "-");

			const lastViewedDate = localStorage.getItem("lastViewedGoalDate");
			console.log({ today, lastViewedDate });

			if (lastViewedDate === today) {
				console.log("DailyGoalManager: Already viewed today (localStorage)");
				return;
			}

			try {
				const res = await apiClient.api["daily-goal"].$get();
				console.log("DailyGoalManager: API status", res.status);
				if (res.ok) {
					const data = await res.json();
					console.log("DailyGoalManager: API data", data);
					// Check if 'error' key exists in data
					if ("error" in data) {
						console.error("DailyGoalManager: API error", data.error);
						return;
					}

					// If API says it's already viewed, respect that and update localStorage
					// Note: We might want to ignore this for testing too if we want to force display regardless of server state
					if (data.isViewed) {
						console.log("DailyGoalManager: Already viewed (server)");
						localStorage.setItem("lastViewedGoalDate", today);
						return;
					}

					setGoal(data as DailyGoal);
					console.log("DailyGoalManager: Goal set");
				}
			} catch (error) {
				console.error("Failed to fetch daily goal", error);
			}
		};

		checkAndFetchGoal();
	}, []);

	const handleClose = async () => {
		if (!goal) return;

		// Optimistic update (hide modal immediately)
		setGoal(null);

		// Update localStorage
		const today = new Date()
			.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
			.replaceAll("/", "-");
		localStorage.setItem("lastViewedGoalDate", today);

		try {
			await apiClient.api["daily-goal"][":id"].viewed.$patch({
				param: { id: goal.id },
			});
		} catch (error) {
			console.error("Failed to mark goal as viewed", error);
		}
	};

	if (!goal || goal.isViewed) return null;

	return <DailyGoalModal goal={goal} onClose={handleClose} />;
}
