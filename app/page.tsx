"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DailyGoalManager } from "@/components/daily-goal-manager";
import {
	ActivityCard,
	type ActivityData,
} from "@/components/home/activity-card";
import { HomeHeader } from "@/components/home/home-header";
import { apiClient } from "@/lib/api-client";

interface HomeData {
	user: {
		id?: string; // Ensure id is available
		name: string;
		image: string | null;
		characterName: string | null;
		level: number;
		hasUnreadNotifications: boolean;
	};
	stats: {
		currentStreak: number;
		maxStreak: number;
		todayExerciseMinutes: number;
		maxExerciseMinutes: number;
		monthMaxMinutes: number;
		graphData: {
			label: string;
			minutes: number;
			type: string;
		}[];
	};
	dailyQuote: {
		text: string;
	} | null;
	friends: {
		user: {
			id: string;
			name: string;
			image: string | null;
			characterName: string | null;
			level: number;
		};
		stats: {
			currentStreak: number;
			maxStreak: number;
			todayExerciseMinutes: number;
			maxExerciseMinutes: number;
			graphData: {
				label: string;
				minutes: number;
				type: string;
			}[];
		};
		quote: {
			text: string;
		} | null;
	}[];
}

export default function Home() {
	const [data, setData] = useState<HomeData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await apiClient.api.home.$get();
				if (res.ok) {
					const json = await res.json();
					if (json && typeof json === "object" && "error" in json) return;
					// Bypassing excessively deep type instantiation error from Hono RPC
					setData(json as unknown as HomeData);
				} else if (res.status === 401) {
					window.location.href = "/login";
				}
			} catch (error) {
				console.error("Failed to fetch home data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	if (isLoading || !data) {
		return (
			<div className="flex h-screen items-center justify-center bg-white">
				<Loader2 className="size-8 animate-spin text-rose-400" />
			</div>
		);
	}

	// Prepare user self activity data
	const selfActivity: ActivityData = {
		user: {
			id: "me", // Placeholder or fetch actual ID if needed
			name: data.user.name,
			image: data.user.image,
			characterName: data.user.characterName,
			level: data.user.level,
		},
		stats: {
			currentStreak: data.stats.currentStreak,
			maxStreak: data.stats.maxStreak,
			todayExerciseMinutes: data.stats.todayExerciseMinutes,
			maxExerciseMinutes: data.stats.maxExerciseMinutes,
			graphData: data.stats.graphData,
		},
		quote: data.dailyQuote?.text ?? null,
	};

	return (
		<div className="min-h-screen bg-white pb-24 font-sans text-slate-900">
			{/* Daily Goal Modal Manager */}
			<DailyGoalManager />

			{/* Custom Header */}
			<HomeHeader hasUnreadNotifications={data.user.hasUnreadNotifications} />

			<main className="space-y-4">
				{/* Self Activity Card (Always first, color index 0) */}
				<ActivityCard data={selfActivity} colorIndex={0} isSelf={true} />

				{/* Friends Activity Cards (Color cycling: 1, 2, 0, 1...) */}
				{data.friends &&
					data.friends.length > 0 &&
					data.friends.map((friend, index) => (
						<ActivityCard
							key={friend.user.id}
							data={{
								...friend,
								quote: friend.quote?.text ?? null,
							}}
							colorIndex={index + 1}
						/>
					))}
			</main>
		</div>
	);
}
