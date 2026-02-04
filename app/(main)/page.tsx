"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DailyGoalManager } from "@/components/daily-goal-manager";
import {
	FriendActivityCard,
	type FriendData,
} from "@/components/home/friend-activity-card";
import { HomeHeader } from "@/components/home/home-header";
import { StatsCard } from "@/components/home/stats-card";
import { UserSection } from "@/components/home/user-section";
import { apiClient } from "@/lib/api-client";

// Types matching API response
interface HomeData {
	user: {
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
	friends: FriendData[];
}

export default function Home() {
	const [data, setData] = useState<HomeData | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const res = await apiClient.api.home.$get();
			if (res.ok) {
				// biome-ignore lint/suspicious/noExplicitAny: Hono RPC type instantiation is too deep
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const json = (await res.json()) as any;
				if ("error" in json) return;
				setData(json as HomeData);
			} else if (res.status === 401) {
				// If unauthorized (e.g. invalid session after DB reset), redirect to login
				// In a real app we might use router.push, but window.location ensures full reload/clean slate
				window.location.href = "/login";
			}
		};
		fetchData();
	}, []);

	if (!data) {
		// Loading state
		return <div className="min-h-screen"></div>;
	}

	return (
		<div className="min-h-screen pb-32 font-sans">
			{/* Daily Goal Modal Manager */}
			<DailyGoalManager />

			{/* Main Content */}
			<div className="mx-auto min-h-screen relative">
				<HomeHeader hasUnreadNotifications={data.user.hasUnreadNotifications} />

				<main className="space-y-6">
					<UserSection
						name={data.user.name}
						characterName={data.user.characterName}
						imageUrl={data.user.image}
					/>

					<StatsCard
						level={data.user.level}
						currentStreak={data.stats.currentStreak}
						maxStreak={data.stats.maxStreak}
						todayMinutes={data.stats.todayExerciseMinutes}
						maxMinutes={data.stats.maxExerciseMinutes}
						monthMaxMinutes={data.stats.monthMaxMinutes}
						graphData={data.stats.graphData}
						quote={data.dailyQuote?.text ?? null}
					/>

					{/* Friends List */}
					{data.friends?.length > 0 && (
						<div className="space-y-4">
							<div className="flex items-center justify-between mx-4 mt-2">
								<h2 className="font-bold text-lg">友達</h2>
							</div>
							{data.friends.map((friend) => (
								<FriendActivityCard key={friend.user.id} friend={friend} />
							))}
						</div>
					)}
				</main>
			</div>
			<BottomNav />
		</div>
	);
}
