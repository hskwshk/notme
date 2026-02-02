"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface CalendarData {
	year: number;
	month: number;
	monthLabel: string;
	currentStreak: number;
	days: {
		date: string;
		day: number;
		isFuture: boolean;
		hasActivity: boolean;
		stamp: {
			name: string;
			imageUrl: string;
		} | null;
	}[];
	level: number;
	missionProgress: {
		current: number;
		required: number;
		remaining: number;
	};
	isLevelUpReady: boolean;
	stats: {
		maxStreak: number;
		totalStamps: number;
		totalDuration: number;
	};
	gacha: {
		canDraw: boolean;
	};
}

export default function CalendarPage() {
	const [data, setData] = useState<CalendarData | null>(null);
	const [currentDate, setCurrentDate] = useState(new Date());

	// Gacha State
	const [isGachaOpen, setIsGachaOpen] = useState(false);
	const [newStamp, setNewStamp] = useState<{
		name: string;
		imageUrl: string;
	} | null>(null);

	useEffect(() => {
		const fetchCalendar = async () => {
			const year = currentDate.getFullYear().toString();
			const month = (currentDate.getMonth() + 1).toString();

			const res = await apiClient.api.calendar.$get({
				query: { year, month },
			});

			if (res.ok) {
				const json = await res.json();
				if ("error" in json) return;
				setData(json as CalendarData);
			}
		};
		fetchCalendar();
	}, [currentDate]);

	const handlePrevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const handleNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const handleGachaDraw = async () => {
		if (!data?.isLevelUpReady) return;

		// Trigger Gacha
		const res = await apiClient.api.calendar.gacha.$post();
		if (res.ok) {
			const json = await res.json();
			if ("error" in json) {
				alert(json.error); // Handle error properly in real app
				return;
			}

			if ("stamp" in json) {
				setNewStamp(json.stamp);
				setIsGachaOpen(true);
				// Refresh data after close, but we can optimistically update level too?
				// Better to refresh after modal close.
			}
		}
	};

	const handleGachaClose = () => {
		setIsGachaOpen(false);
		setNewStamp(null);
		// Trigger refresh
		setCurrentDate(new Date(currentDate));
	};

	if (!data)
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				Loading...
			</div>
		);

	return (
		<div>
			<h1>Calendar Data</h1>
			<div>
				<button type="button" onClick={handlePrevMonth}>
					Prev Month
				</button>
				<span>
					{data.year}-{data.month}
				</span>
				<button type="button" onClick={handleNextMonth}>
					Next Month
				</button>
			</div>

			<div>
				<h2>Actions</h2>
				<button
					type="button"
					onClick={handleGachaDraw}
					disabled={!data.isLevelUpReady}
				>
					Draw Gacha
				</button>
			</div>

			{isGachaOpen && newStamp && (
				<div
					style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
				>
					<h3>New Stamp!</h3>
					<p>{newStamp.name}</p>
					{/* biome-ignore lint/performance/noImgElement: dynamic user content */}
					<img src={newStamp.imageUrl} alt={newStamp.name} width={100} />
					<button type="button" onClick={handleGachaClose}>
						Close
					</button>
				</div>
			)}

			{console.log("Calendar Data:", data)}
			<p>Check console for data.</p>
		</div>
	);
}
