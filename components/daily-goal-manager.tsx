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
		const fetchGoal = async () => {
			try {
				const res = await apiClient.api["daily-goal"].$get();
				if (res.ok) {
					const data = await res.json();
					// Check if 'error' key exists in data
					if ("error" in data) return;

					setGoal(data as DailyGoal);
				}
			} catch (error) {
				console.error("Failed to fetch daily goal", error);
			}
		};

		fetchGoal();
	}, []);

	const handleClose = async () => {
		if (!goal) return;

		// Optimistic update (hide modal immediately)
		setGoal(null);

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
