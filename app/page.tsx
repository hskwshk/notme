"use client";

import { useEffect, useState } from "react";
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
		graphData: {
			label: string;
			minutes: number;
			type: string;
		}[];
	};
	dailyQuote: {
		text: string;
	} | null;
}

export default function Home() {
	const [data, setData] = useState<HomeData | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const res = await apiClient.api.home.$get();
			if (res.ok) {
				const json = await res.json();
				if ("error" in json) return;
				setData(json as HomeData);
			} else if (res.status === 401) {
				window.location.href = "/login";
			}
		};
		fetchData();
	}, []);

	if (!data) {
		return <div>Loading...</div>;
	}

	console.log("Home Data:", data);

	return (
		<div>
			<h1>Home Data</h1>
			<p>Check console for data.</p>
		</div>
	);
}
